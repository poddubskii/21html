let currentHandIdx = 0;
const currentBet = document.getElementById('current-bet');
const currentBetDisplay = document.getElementById('current-bet');
const resetBtn = document.getElementById('reset-bet');
const betChips = document.querySelectorAll('.bet-chip');    
document.getElementById('deal-btn').addEventListener('click', async () => {
    const bet = document.getElementById('current-bet').value;
    const response = await fetch('/deal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bet: bet})
    });
    
    const data = await response.json();
    if (data.black_jack) {
        await updateUI(data);
        document.getElementById('player').innerText = '♥️Blackjack!♠️ Player Wins 🏆';
        document.getElementById('deal-btn').disabled = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        
        return;
    }
    if (data.can_split) {
        document.getElementById('split-btn').disabled = false;
    }
    if (data.error) return alert(data.error);
    await updateUI(data);
});

async function updateUI(data) {
    document.getElementById('balance').innerText = data.balance;
    const dealerDiv = document.getElementById('dealer-cards');
    const player = document.getElementById('player');
    const handsDiv = document.getElementById('player-hands-container');

    // 1. Сбрасываем поле перед раздачей
    dealerDiv.innerHTML = `<img src="/static/cards/${data.dealer_up_card}.png">` +
                          `<img src="/static/cards/back.png" id="dealer-hidden">`;
    handsDiv.innerHTML = '';

    // 2. Создаем контейнер руки
    const handDiv = document.createElement('div');
    handDiv.className = 'hand';
    handsDiv.appendChild(handDiv);

    // 3. Функция ожидания (для анимации)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 4. Постепенно добавляем карты игрока
    for (const card of data.player_hands[0]) {
        const img = document.createElement('img');
        img.src = `/static/cards/${card}.png`;
        img.className = 'card-anim'; // Ваш класс с анимацией появления
        
        handDiv.appendChild(img);
        
        // Ждем 500мс между появлением каждой карты
        await sleep(500); 
        
        img.classList.remove('card-anim');
    }

    // 5. Финальные настройки
    player.innerText = data.total;
    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    document.getElementById('deal-btn').disabled = true;
};

document.getElementById('hit-btn').addEventListener('click', async () => {
    const response = await fetch('/hit', { method: 'POST' });
    const data = await response.json();
    const blackJack = data.blackjack;   

    // Обновляем текущую руку
    const currentHand = document.querySelectorAll('.hand')[0];
    const newCard = data.hand[data.hand.length - 1];
    const player = document.getElementById('player');
     player.innerText = data.total;
    currentHand.innerHTML += `<img src="/static/cards/${newCard}.png">`;
    if (blackJack) {
        document.getElementById('balance').innerText = data.balance;
        player.innerText = 'Blackjack!';
        set_scaled_style();        
        document.getElementById('deal-btn').disabled = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        revealDealerCard();
    }
   
    currentHand.children[currentHand.children.length-1].classList.add('card-anim');
    setTimeout(() => {
    currentHand.children[currentHand.children.length-1].classList.remove('card-anim');
    }, 500);
    if (data.is_bust){
        document.getElementById('balance').innerText = data.balance;
        player.innerText = toString(data.total) + 'Bust!';
        set_scaled_style();
        document.getElementById('deal-btn').disabled = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        document.getElementById('double-btn').disabled = true;
    }

});

function set_scaled_style() {
    const player = document.getElementById('player');
        player.classList.add('scaled');
        setTimeout(() => {
            player.classList.remove('scaled');
        }, 1000);
    };
async function revealDealerCard() {
     const response = await fetch('/stand', { method: 'POST' });
    const data = await response.json();
    const d_total = data.d_total;
    const p_total = data.p_total;
    const dealer_cards_numbers = data.dealer_cards_numbers;
    const player = document.getElementById('player');
    const dealer = document.getElementById('dealer');
    // Показываем карты дилера
    const dealerDiv = document.getElementById('dealer-cards');
    dealerDiv.innerHTML = '';
    let i = 0;
    let total_dealer=0;
    data.dealer_cards.forEach(card => {
        setTimeout(() => {
        dealerDiv.innerHTML += `<img src="/static/cards/${card}.png">`;
    }, 500);
    
    
    
    let total_dealer = 0;

    for (let card of dealer_cards_numbers) {

        if (card === 'A') {
            total_dealer += (total_dealer + 11 <= 21) ? 11 : 1;

        } else if (['J', 'Q', 'K'].includes(card)) {
            total_dealer += 10;

        } else {
            total_dealer += parseInt(card);
        }
    }
    
    
    
    // total_dealer += parseInt(dealer_cards_numbers[i]); // Учитываем карты с числовыми значениями и картами с 10
    dealer.innerHTML = total_dealer; // Показываем текущую сумму карт дилера
    i++;
    });
    document.getElementById('balance').innerText = data.balance;
    player.innerText = data.results.join(', ') + `  ${p_total}`;
    dealer.innerText = d_total;
    set_scaled_style();   
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
};

document.getElementById('stand-btn').addEventListener('click', async () => {
   await revealDealerCard();
});

document.getElementById('double-btn').addEventListener('click', async () => {
    const response = await fetch('/double', { method: 'POST' });
    const data = await response.json();
    
    if (data.error) return alert(data.error);

    // Обновляем баланс и отрисовываем новую карту
    document.getElementById('balance').innerText = data.balance;
    renderPlayerHands([data.hand]); // Перерисовываем руку
    
    // Автоматически завершаем ход игрока после дабла
    document.getElementById('stand-btn').click(); 
});

// Функция для Сплита (Split)
document.getElementById('split-btn').addEventListener('click', async () => {
    const response = await fetch('/split', { method: 'POST' });
    const data = await response.json();
    
    if (data.error) return alert(data.error);

    document.getElementById('balance').innerText = data.balance;
    renderPlayerHands(data.player_hands);
    
    // Сплит можно сделать только один раз в этой версии, отключаем кнопку
    document.getElementById('split-btn').disabled = true;
});

// Универсальная функция отрисовки рук игрока
function renderPlayerHands(hands) {
    const container = document.getElementById('player-hands-container');
    container.innerHTML = ''; // Очищаем старые карты

    hands.forEach((hand, index) => {
        const handDiv = document.createElement('div');
        handDiv.className = 'hand-box'; // Стилизуй это в CSS как inline-block
        handDiv.innerHTML = `<h4>Hand ${index + 1}</h4>`;
        
        hand.forEach(card => {
            const img = document.createElement('img');
            img.src = `/static/cards/${card}.png`;
            img.className = 'card-anim-split'; // Наша CSS анимация вылета
            handDiv.appendChild(img);
        });
        
        container.appendChild(handDiv);
    });



};

document.querySelectorAll('.bet-chip').forEach(button => {
    button.addEventListener('click', () => {
        const value = parseInt(button.getAttribute('data-value'));
        const input = document.getElementById('current-bet');
        input.value =  value;
        // Обновите отображение текущей ставки, если нужно
        document.getElementById('current-bet').innerText = input.value;
    });
});

resetBtn.addEventListener('click', () => {
    const minBet = 10; // Минимальная ставка
    currentBet.value = minBet;
    currentBetDisplay.innerText = minBet;
});

currentBet.addEventListener('input', () => {
    currentBetDisplay.innerText = currentBet.value;
});