# Guess the Word

A single-player word guessing game built with HTML, CSS, and JavaScript for the CI536 Integrated Group Project at the University of Birmingham.

## How to Run

1. Download or clone the repository
2. Make sure all three files are in the same folder:
   - `index.html`
   - `style.css`
   - `game.js`
3. Open `index.html` in any web browser
4. No installation or internet connection required to play

## How to Play

- A hidden word is shown as blank tiles
- Type a single letter to guess one letter, or type the full word to guess it all at once
- Correct letters turn green, wrong letters are tracked and shown on the keyboard
- You have a limited number of wrong attempts depending on difficulty
- Use the Hint button to reveal a random letter - costs points and time
- The game ends when you reveal the word, run out of attempts, or the timer reaches zero

## Difficulty Levels

| Difficulty | Time | Wrong Attempts |
|------------|------|----------------|
| Easy       | 90s  | 6              |
| Medium     | 60s  | 5              |
| Hard       | 40s  | 4              |

## Scoring

- Base score: 500 points per round
- Wrong guess: −40 points
- Hint used: −50 points and −5 seconds
- Time bonus on win: remaining seconds × 3

Best score and last round result are saved per difficulty using local storage.

## File Structure

```
/
├── index.html    — game structure and screens
├── style.css     — all styling and layout
├── game.js       — all game logic
└── README.md     — this file
```

## Built With

- HTML5
- CSS3
- JavaScript (Vanilla)
- Google Fonts - Space Grotesk and Space Mono

## Module

CI536 Integrated Group Project - University of Birmingham
