let currentHandIdx = 0;

document.getElementById('deal-btn').addEventListener('click', async () => {
    const bet = document.getElementById('bet-input').value;
    const response = await fetch('/deal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bet: bet})
    });
    
    const data = await response.json();
    if (data.black_jack) {
        updateUI(data);
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
    updateUI(data);
});

function updateUI(data) {
    document.getElementById('balance').innerText = data.balance;
    const dealerDiv = document.getElementById('dealer-cards');
    const player = document.getElementById('player');
    player.innerText = data.total;
    
    dealerDiv.innerHTML = `<img src="/static/cards/${data.dealer_up_card}.png">` +
                         `<img src="/static/cards/back.png" id="dealer-hidden">`;

    const handsDiv = document.getElementById('player-hands-container');
    handsDiv.innerHTML = '';
    data.player_hands.forEach((hand, i) => {
        const handDiv = document.createElement('div');
        handDiv.className = 'hand';
        hand.forEach(card => {
            handDiv.innerHTML += `<img src="/static/cards/${card}.png">`;
            handsDiv.appendChild(handDiv);
              setTimeout(() => {
                handsDiv.appendChild(handDiv);
                // handDiv.classList.remove('card-anim');
                }, 800);
            
        });
        
      
        });

    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    document.getElementById('deal-btn').disabled = true;
}

document.getElementById('hit-btn').addEventListener('click', async () => {
    const response = await fetch('/hit', { method: 'POST' });
    const data = await response.json();
    const blackJack = data.blackjack;   

    // Обновляем текущую руку
    const currentHand = document.querySelectorAll('.hand')[0];
    const newCard = data.hand[data.hand.length - 1];
    const player = document.getElementById('player');
    
    currentHand.innerHTML += `<img src="/static/cards/${newCard}.png">`;
    if (blackJack) {
        document.getElementById('balance').innerText = data.balance;
        player.innerText = 'Blackjack!';
        document.getElementById('deal-btn').disabled = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        revealDealerCard();
    }
    player.innerText = data.total;
    currentHand.children[currentHand.children.length-1].classList.add('card-anim');
    setTimeout(() => {
    currentHand.children[currentHand.children.length-1].classList.remove('card-anim');
    }, 800);
    if (data.is_bust){
        document.getElementById('balance').innerText = data.balance;
        player.innerText = 'Bust!';
        document.getElementById('deal-btn').disabled = false;
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        document.getElementById('double-btn').disabled = true;
    }

});
async function revealDealerCard() {
     const response = await fetch('/stand', { method: 'POST' });
    const data = await response.json();
    const player = document.getElementById('player');
    // Показываем карты дилера
    const dealerDiv = document.getElementById('dealer-cards');
    dealerDiv.innerHTML = '';
    data.dealer_cards.forEach(card => {
        dealerDiv.innerHTML += `<img src="/static/cards/${card}.png">`;
    });

    document.getElementById('balance').innerText = data.balance;
    player.innerText = data.results.join(', ');
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    setTimeout(() => {
        player.innerText = 'Player';        
    }, 5000);
}
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
}
