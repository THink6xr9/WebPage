export function initPuzzle() {
    const puzzleHTML = `
        <div id="puzzleOverlay" class="puzzle-overlay hidden">
            <div class="puzzle-modal">
                <button id="closePuzzle" class="close-puzzle">×</button>
                <h2>White to move, Mate in 1</h2>
                <div id="chessboard" class="chessboard"></div>
                <div id="puzzleFeedback" class="puzzle-feedback"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', puzzleHTML);

    const overlay = document.getElementById('puzzleOverlay');
    const closeBtn = document.getElementById('closePuzzle');
    const board = document.getElementById('chessboard');
    const feedback = document.getElementById('puzzleFeedback');

    closeBtn.addEventListener('click', closePuzzle);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePuzzle();
    });

    renderBoard();

    function closePuzzle() {
        overlay.classList.add('hidden');
        feedback.textContent = '';
    }

    function renderBoard() {
        // Simple mate in 1 scenario
        // White Rook on h1, White King on g1
        // Black King on h8, pawn on g7, pawn on h7
        // Winning move: Rook to h8 (or some backrank mate)
        // Let's do a classic backrank:
        // White Rook at d1
        // Black King at e8, pawns at d7, e7, f7
        // Correct move: d1 to d8 is Mate.

        const pieces = {
            'e8': '♚', 'd7': '♟', 'e7': '♟', 'f7': '♟',
            'd1': '♖', 'e1': '♔'
        };

        const targetSquare = 'd8';
        const selectedPieceSquare = 'd1';
        let selected = false;

        board.innerHTML = '';
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let rank = 8; rank >= 1; rank--) {
            for (let f = 0; f < 8; f++) {
                const file = files[f];
                const squareId = file + rank;
                const isDark = (rank + f) % 2 !== 0; // Rank + file parity

                const sq = document.createElement('div');
                sq.className = `square ${isDark ? 'dark' : 'light'}`;
                sq.dataset.square = squareId;

                if (pieces[squareId]) {
                    const piece = document.createElement('span');
                    piece.className = 'piece';
                    piece.textContent = pieces[squareId];
                    // Very simple interaction logic
                    if (squareId === selectedPieceSquare) {
                        piece.style.cursor = 'pointer';
                        piece.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!selected) {
                                selected = true;
                                sq.classList.add('selected');
                            } else {
                                selected = false;
                                sq.classList.remove('selected');
                            }
                        });
                    }
                    sq.appendChild(piece);
                }

                sq.addEventListener('click', () => {
                    if (selected) {
                        if (squareId === targetSquare) {
                            feedback.style.color = 'green';
                            feedback.textContent = 'Checkmate!';
                            setTimeout(() => {
                                window.location.href = 'enter-the-world.html';
                            }, 1000);
                        } else {
                            feedback.style.color = 'red';
                            feedback.textContent = 'Incorrect move. Try again.';
                            // reset selection
                            selected = false;
                            document.querySelector('.square.selected')?.classList.remove('selected');
                            // subtle shake effect could be added
                        }
                    }
                });

                board.appendChild(sq);
            }
        }
    }
}

export function openPuzzle() {
    const overlay = document.getElementById('puzzleOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}
