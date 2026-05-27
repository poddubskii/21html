from flask import Flask, render_template, jsonify, session, request
import random

app = Flask(__name__)
app.secret_key = 'blackjack_secret_key'

SUITS = ['C', 'D', 'H', 'S']
RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
VALUES = {r: int(r) if r.isdigit() else 10 for r in RANKS}
VALUES['A'] = 11

def get_hand_total(hand):
    total = sum(VALUES[c[:-1]] for c in hand)
    aces = sum(1 for c in hand if c[:-1] == 'A')
    while total > 21 and aces:
        total -= 10
        aces -= 1
    return total

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/')
def index():
    if 'balance' not in session:
        session['balance'] = 1000
    return render_template('index.html')
def toInt(string):
    if string in ['J', 'Q', 'K']:
        return 10
    elif string == 'A':
        return 11
    else:
        return int(string)
@app.route('/deal', methods=['POST'])
def deal():
    bet = int(request.json.get('bet', 10))
    if session['balance'] < bet:
        session['balance'] = 1000
        # return jsonify({"error": "Insufficient funds"}), 400

    deck = [r + s for s in SUITS for r in RANKS]
    random.shuffle(deck)

    session['balance'] -= bet
    session['current_bet'] = bet
    session['deck'] = deck
    session['player_hands'] = [[deck.pop(), deck.pop()]]
    session['dealer_cards'] = [deck.pop(), deck.pop()]
    session['current_hand_idx'] = 0
    session['game_over'] = False
    first_card = toInt(session['player_hands'][0][0][:-1])
    second_card = toInt(session['player_hands'][0][1][:-1])
    if first_card + second_card == 21:
        session['balance'] += bet * 2.5
        session['game_over'] = True
        black_jack = True
    else:
        black_jack = False
    return jsonify({
        "balance": session['balance'],
        "player_hands": session['player_hands'],
        "dealer_up_card": session['dealer_cards'][0],
        "can_split": first_card == second_card,
        "black_jack": black_jack,
        "total": first_card + second_card
    })

@app.route('/hit', methods=['POST'])
def hit():
    deck = session['deck']
    idx = session['current_hand_idx']
    session['player_hands'][idx].append(deck.pop())
    
    total = get_hand_total(session['player_hands'][idx])
    session['deck'] = deck
    session.modified = True

    return jsonify({
        "hand": session['player_hands'][idx],
        "total": total,
        "is_bust": total > 21
    })

@app.route('/stand', methods=['POST'])
def stand():
    # Простая логика: дилер берет до 17
    deck = session['deck']
    while get_hand_total(session['dealer_cards']) < 17:
        session['dealer_cards'].append(deck.pop())
    
    # Расчет результатов
    d_total = get_hand_total(session['dealer_cards'])
    bet = session['current_bet']
    results = []
    
    for hand in session['player_hands']:
        p_total = get_hand_total(hand)
        if p_total > 21:
            res = "LOSE"
        elif d_total > 21 or p_total > d_total:
            res = "WIN"
            session['balance'] += bet * 2
        elif p_total < d_total:
            res = "LOSE"
        else:
            res = "PUSH"
            session['balance'] += bet
        results.append(res)
    dealer_cards = session['dealer_cards']
    dealer_cards_numbers = [card[:-1] for card in dealer_cards]
    session.modified = True
    return jsonify({
        "dealer_cards": session['dealer_cards'],
        "dealer_cards_numbers":dealer_cards_numbers,
        "results": results,
        "balance": session['balance'],
        "d_total": d_total,
        "p_total": p_total
    })
@app.route('/double', methods=['POST'])
def double():
    deck = session['deck']
    idx = session['current_hand_idx']
    bet = session['current_bet']

    if session['balance'] < bet:
        return jsonify({"error": "Недостаточно средств для удвоения"}), 400

    # Списываем еще одну ставку
    session['balance'] -= bet
    # Добавляем ровно одну карту
    session['player_hands'][idx].append(deck.pop())
    
    session['deck'] = deck
    session.modified = True
    
    # После Double ход всегда переходит к дилеру (или следующей руке)
    return jsonify({
        "hand": session['player_hands'][idx],
        "balance": session['balance'],
        "total": get_hand_total(session['player_hands'][idx])
    })

@app.route('/split', methods=['POST'])
def split():
    deck = session['deck']
    bet = session['current_bet']
    
    if session['balance'] < bet:
        return jsonify({"error": "Недостаточно средств для сплита"}), 400

    # Берем текущую руку (она должна быть одна и в ней должно быть 2 карты)
    hand = session['player_hands'][0]
    
    # Создаем две руки из одной
    card1 = hand[0]
    card2 = hand[1]
    
    # Новые руки: по одной старой карте + по одной новой из колоды
    new_hands = [
        [card1, deck.pop()],
        [card2, deck.pop()]
    ]
    
    session['balance'] -= bet
    session['player_hands'] = new_hands
    session['deck'] = deck
    session.modified = True
    
    return jsonify({
        "player_hands": session['player_hands'],
        "balance": session['balance']
    })
if __name__ == '__main__':
    app.run('0.0.0.0' , port=5001)
    