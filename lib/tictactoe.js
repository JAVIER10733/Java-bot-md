/**
 * Java Bot MD - Motor de Tres en Raya (Tic-Tac-Toe)
 * Implementación optimizada usando operaciones a nivel de bits para máxima eficiencia y velocidad.
 */
class TicTacToe {
    /**
     * Inicializa una nueva partida de Tres en Raya.
     * @param {string} playerX - Nombre o identificador del jugador X.
     * @param {string} playerO - Nombre o identificador del jugador O.
     */
    constructor(playerX = 'Jugador X', playerO = 'Jugador O') {
        this.playerX = playerX;
        this.playerO = playerO;
        this._currentTurn = false; // false = Turno de X, true = Turno de O
        this._x = 0; // Mapa de bits de las jugadas de X
        this._o = 0; // Mapa de bits de las jugadas de O
        this.turns = 0; // Número total de turnos jugados
    }

    /**
     * Obtiene el estado actual del tablero como un número entero.
     * @returns {number}
     */
    get board() {
        return this._x | this._o;
    }

    /**
     * Obtiene el identificador del jugador que tiene el turno actual.
     * @returns {string}
     */
    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX;
    }

    /**
     * Verifica si hay un ganador en el tablero.
     * @returns {string|null} El identificador del ganador, o null si no hay ganador.
     */
    get winner() {
        const winningPatterns = [
            0b111000000, // Fila superior
            0b000111000, // Fila central
            0b000000111, // Fila inferior
            0b100100100, // Columna izquierda
            0b010010010, // Columna central
            0b001001001, // Columna derecha
            0b100010001, // Diagonal principal (izq-der)
            0b001010100  // Diagonal inversa (der-izq)
        ];

        for (const pattern of winningPatterns) {
            if ((this._x & pattern) === pattern) return this.playerX;
            if ((this._o & pattern) === pattern) return this.playerO;
        }

        return null;
    }

    /**
     * Verifica si la partida ha terminado en empate.
     * @returns {boolean}
     */
    get isDraw() {
        return this.turns === 9 && this.winner === null;
    }

    /**
     * Verifica si la partida ha terminado (por victoria o empate).
     * @returns {boolean}
     */
    get isGameOver() {
        return this.winner !== null || this.isDraw;
    }

    /**
     * Registra el movimiento de un jugador en una posición específica.
     * @param {string} player - El identificador del jugador que hace el movimiento.
     * @param {number} pos - La posición en el tablero (0-8).
     * @returns {number} 1 si el movimiento es válido, 0 si la casilla está ocupada, -1 si el juego terminó o es un movimiento inválido.
     */
    turn(player, pos) {
        // Validar que el juego no haya terminado y la posición sea válida (0-8)
        if (this.isGameOver || pos < 0 || pos > 8) return -1;
        
        // Validar que sea el turno correcto del jugador
        if (player !== this.currentTurn) return -1;
        
        // Validar que la casilla no esté ya ocupada
        if ((this.board & (1 << pos)) !== 0) return 0;
        
        // Registrar el movimiento
        const value = 1 << pos;
        if (this._currentTurn) {
            this._o |= value;
        } else {
            this._x |= value;
        }
        
        // Cambiar el turno y aumentar el contador
        this._currentTurn = !this._currentTurn;
        this.turns++;
        return 1;
    }

    /**
     * Genera una representación visual del tablero lista para WhatsApp.
     * @returns {string}
     */
    render() {
        const cells = [...Array(9)].map((_, i) => {
            const bit = 1 << i;
            return this._x & bit ? '❌' : this._o & bit ? '⭕' : `${i + 1}`;
        });

        const turnoIcon = this.currentTurn === this.playerX ? '❌' : '⭕';
        
        return `╭━━━⊱ 🎮 *TRES EN RAYA* ⊱━━━╮
│
│  🧩 *Tablero:*
│  ${cells[0]} │ ${cells[1]} │ ${cells[2]}
│  ───┼───┼───
│  ${cells[3]} │ ${cells[4]} │ ${cells[5]}
│  ───┼───┼───
│  ${cells[6]} │ ${cells[7]} │ ${cells[8]}
│
│  🔄 *Turno de:* ${turnoIcon} ${this.currentTurn}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
    }
}

module.exports = TicTacToe;