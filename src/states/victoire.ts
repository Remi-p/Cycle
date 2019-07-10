import { cliquable, reset, save, sociaux, toHigh } from '../functions';
import { BASE_SIZE, pseudo as pseudoVar, Stats } from '../variables';
import Phaser from 'phaser-ce';
import { lang } from '../i18n';
import { selectedLang } from './langue';
import { Menu } from './menu';

let pseudo = pseudoVar;

export class Victoire extends Phaser.State {
    static NAME = Victoire.prototype.constructor.name;

    private esc_key: Phaser.Key;
    private pseudo: Phaser.Text;

    create() {
        const label = cliquable(
            BASE_SIZE / 2,
            BASE_SIZE / 4,
            lang[selectedLang].Victoire + '\n\n' + Math.round(Stats.score),
            25,
            0.5,
            0.5,
            0,
            500,
            null,
            this,
        );

        const enter_pseudo = cliquable(
            BASE_SIZE / 2,
            BASE_SIZE / 2,
            lang[selectedLang].Pseudo,
            25,
            0.5,
            0.5,
            300,
            500,
            null,
            this,
        );

        this.pseudo = cliquable(BASE_SIZE / 2, (BASE_SIZE / 4) * 3, pseudo + '_', 25, 0.5, 0.5, 0, 500, null, this);

        // Retour au menu
        this.esc_key = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);

        // Clavier
        this.game.input.keyboard.addCallbacks(this, this.tape);

        // Retourw
        const back = this.game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);

        save({ stage: 0, score: 0, difficulty: Stats.difficulty });
    }
    addToPseudo(letter) {
        // Écriture du pseudo

        if (pseudo.length <= 16) pseudo = pseudo + letter;

        if (pseudo.length < 16) this.pseudo.text = pseudo + '_';
        else this.pseudo.text = pseudo;
    }
    tape(evt) {
        if (evt.which == Phaser.Keyboard.BACKSPACE) {
            // deleteToPseudo
            if (pseudo.length > 0) {
                pseudo = pseudo.slice(0, -1);
                this.pseudo.text = pseudo + '_';
            }

            return;
        }

        if (evt.which == Phaser.Keyboard.ENTER) {
            if (pseudo.length > 0) {
                toHigh(Stats, pseudo);
                sociaux(Stats, pseudo, lang);
                reset(Stats);
                this.game.state.start('Scores');
            }

            return;
        }

        // http://www.html5gamedevs.com/topic/4068-text-input-from-users-in-phaser/
        if (evt.which < 'A'.charCodeAt(0) || evt.which > 'Z'.charCodeAt(0)) {
            //console.log( "Not a letter: ", evt.which );
            return;
        }

        let letter = String.fromCharCode(evt.which);
        if (!evt.shiftKey) letter = letter.toLowerCase();

        this.addToPseudo(letter);
    }
    update() {
        // Retour au menu
        if (this.esc_key.isDown) {
            reset(Stats);
            this.game.state.start(Menu.NAME);
        }
    }
}
