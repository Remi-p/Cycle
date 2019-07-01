import { BASE_SIZE, plataille, edited_lvl, pi180 } from '../variables';
import { Play } from './play';
import Phaser from 'phaser';
import { PLANET, PLATFORM, PLAYER, STAR, TRAP } from '../resoucesNames';
import { lang } from '../i18n';
import { lang as selectedLang } from './langue';
import { polarToCartesian } from '../utils/CoordonateSystem';

const alph = 0.5;
const inac = 0.05;
const pi180_invers = 1 / pi180;
const PLATFORMS_HEIGHT_NUMBER = 10;

let invert_redim = 1;

export const Edit = {
    create: function() {
        // ------------------------------------------------------------------ //
        // --------------------------------------------------- Retour au menu //

        this.esc_key = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------ Conteneur général //

        this.general = this.game.add.group();

        this.general.x = BASE_SIZE / 2;
        this.general.y = BASE_SIZE / 2; // Ici, on centre la planete

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // -------------------------------------------- Personnage et planete //

        this.dude = this.general.create(0, -BASE_SIZE / 3, PLAYER);
        this.dude.anchor.set(0.5);
        this.dude.alpha = 0.3;

        this.plnte = this.general.create(0, 0, PLANET);
        this.plnte.anchor.set(0.5);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------ Redimensionnement //

        const maxPlat = (PLATFORMS_HEIGHT_NUMBER * plataille + BASE_SIZE / 6 + plataille + this.dude.height) * 2;

        if (maxPlat > BASE_SIZE)
            // Redimensionnement
            this.redimensionne(BASE_SIZE / maxPlat);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ----------------------------------------------------------- Objets //

        this.platforms = this.game.add.group(this.general);
        this.traps = this.game.add.group(this.general);

        this.stars = this.game.add.group(this.general);
        // Décalage d'une demie-plateforme (raison inconnue)

        this.etoile_pos = this.general.create(0, 0, STAR);
        this.etoile_pos.alpha = 0;
        this.etoile_pos.anchor.set(0.6);
        // Rajout d'informations liées au sprite
        this.etoile_pos.calculDeg = 0;
        this.etoile_pos.calculLvl = 0;

        this.makeSprite();

        this.menu = this.game.add.group(this.general);
        this.menu.x = maxPlat / 2;
        this.menu.y = -maxPlat / 2;

        // Choix du type d'objets
        this.plateforme = this.menu.create(-plataille * 1.5, plataille * 0.5, PLATFORM);
        this.piege = this.menu.create(-plataille * 3, plataille * 0.5, TRAP);
        this.etoile = this.menu.create(-plataille * 1, plataille * 2.5, STAR);
        this.etoile.anchor.set(0.5);

        this.launch = this.game.add.text(plataille, plataille, lang[selectedLang].Tester);
        this.launch.anchor.setTo(0, 0);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ---------------------------------------------- Gestion des cliques //

        this.menu.forEachAlive(this.menuForeach, this);

        this.platforms.forEachAlive(function(c) {
            c.inputEnabled = true;
            c.input.useHandCursor = true;
            c.events.onInputDown.add(alpha, this);
            c.events.onInputOver.add(over, this);
            c.events.onInputOut.add(out, this);
        });

        this.traps.forEachAlive(function(c) {
            c.inputEnabled = true;
            c.input.useHandCursor = true;
            c.events.onInputDown.add(alpha, this);
            c.events.onInputOver.add(over, this);
            c.events.onInputOut.add(out, this);
            c.inputEnabled = false;
        });

        this.game.input.onDown.add(this.clickGeneral, this);

        this.launch.inputEnabled = true;
        this.launch.input.useHandCursor = true;
        this.launch.events.onInputDown.add(this.letsTry, this);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
    },
    letsTry: function() {
        // ------------------------------------------------------------------ //
        // ---------------------------------- Mise-en-place du niveau d'essai //

        edited_lvl.plateformes = [];
        edited_lvl.etoiles = [];
        edited_lvl.pieges = [];

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ----------------------------------------- Écriture des platforms //

        this.platforms.forEachAlive(function(c) {
            if (c.alpha > alph) edited_lvl.plateformes.push([c.calculDeg, c.calculLvl]);
        }, this);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ---------------------------------------------- Écriture des pièges //

        this.traps.forEachAlive(function(c) {
            if (c.alpha > alph) edited_lvl.pieges.push([c.calculDeg, c.calculLvl]);
        }, this);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // --------------------------------------------- Écriture des étoiles //

        if (this.etoile_pos.alpha > 0) this.stars.getTop().kill(); // Detruit la dernière étoile (position du curseur)
        this.stars.forEachAlive(function(c) {
            if (c.alpha > alph) edited_lvl.etoiles.push([c.calculDeg, c.calculLvl]);
        }, this);

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //

        // Le level est prêt à être testé
        edited_lvl.edited = true;

        // Exportation du niveau
        const export_lvl =
            '{' +
            'platforms: [' +
            this.objToString(edited_lvl.plateformes) +
            '], ' +
            'traps: [' +
            this.objToString(edited_lvl.pieges) +
            '], ' +
            'stars: [' +
            this.objToString(edited_lvl.etoiles) +
            ']' +
            '}';
        (window.document.getElementById('export_lvl') as any).value = export_lvl;

        // Affichage pour l'envoi
        window.document.getElementById('SendMeLvl').className = '';

        this.game.state.start('Play');

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
    },
    objToString: function(obj) {
        // Conversion d'un objet en chaîne de caractère symbolisant un tableau
        // javascript.

        let str = '';
        const tmp = [];

        for (let val in obj) {
            tmp.push('[' + obj[val].join(', ') + ']');
        }

        str = tmp.join(', ');

        return str;
    },
    clickGeneral: function() {
        // Pour les étoiles les positions ne sont pas prédéfinies

        if (this.etoile_pos.alpha > 0) {
            let newetoile;

            // Vérification : l'étoile existe-t-elle déjà ou non ?
            this.stars.forEachAlive(function(c) {
                if (c.calculLvl == this.etoile_pos.calculLvl && c.calculDeg == this.etoile_pos.calculDeg) {
                    newetoile = c;
                }
            }, this);

            if (newetoile) {
                // Dans le cas de l'existence, on la supprime
                newetoile.kill();
            } else {
                // Sinon on en crée une nouvelle
                newetoile = this.stars.create(this.etoile_pos.x, this.etoile_pos.y, STAR);
                newetoile.anchor.set(0.6);
                newetoile.angle = this.etoile_pos.angle;
                newetoile.calculLvl = this.etoile_pos.calculLvl;
                newetoile.calculDeg = this.etoile_pos.calculDeg;
            }
        }
    },
    choix: function(sprite) {
        // Avant toute chose : suppression de la dernière étoile ajoutée, si
        // on était en mode "étoile"

        if (this.etoile_pos.alpha > 0) this.stars.getTop().kill();

        // Pour savoir où on clique, on regarde le sprite utilisé

        if (sprite.key == PLATFORM) {
            // Plateforme

            this.changeInputEnabled(this.platforms, true);
            this.changeInputEnabled(this.traps, false);
            this.etoile_pos.alpha = 0;
        } else if (sprite.key == TRAP) {
            // Piege

            this.changeInputEnabled(this.platforms, false);
            this.changeInputEnabled(this.traps, true);
            this.etoile_pos.alpha = 0;
        } else if (sprite.key == STAR) {
            // Etoile

            this.etoile_pos.alpha = alph;

            this.changeInputEnabled(this.platforms, false);
            this.changeInputEnabled(this.traps, false);
        }
    },
    changeInputEnabled: function(group, inputEnabled) {
        // En fonction du choix d'édition, on active ou désactive, et affiche
        // on cache les sprites correspondant

        if (inputEnabled) {
            group.forEachAlive(function(c) {
                c.inputEnabled = true;
                c.alpha = c.alpha > alph ? c.alpha : inac;
            });
        } else {
            group.forEachAlive(function(c) {
                c.inputEnabled = false;
                c.alpha = c.alpha > alph ? c.alpha : 0;
            });
        }
    },
    menuForeach: function(c) {
        // Simplification pour mettre en place les inputs

        c.inputEnabled = true;
        c.input.useHandCursor = true;
        c.events.onInputDown.add(this.choix, this);
    },
    makeSprite: function() {
        // Toutes les variables qui seront utilisés dans cette fonction
        var cx, rayon, perimetre, nbr_plat, deg, tmp, elt;

        // Parcourt du niveau de haut en bas (rayon du cercle)
        for (let i = 0; i < PLATFORMS_HEIGHT_NUMBER; i++) {
            // -------------------------------------------------------------- //
            // ---------------- Calcul du positionnement pour les plateformes //

            cx = i * plataille;

            rayon = BASE_SIZE / 6 + cx;

            perimetre = rayon * Math.PI * 2;

            nbr_plat = Math.round(perimetre / plataille);

            deg = 360 / nbr_plat;

            // -------------------------------------------------------------- //
            // -------------------------------------------------------------- //

            // Parcourt du périmètre du cercle
            for (let j = 0; j < 360; j += deg) {
                // Positions et rotation pour les sprites
                tmp = polarToCartesian(j, rayon);

                // ---------------------------------------------------------- //
                // ---------------------------------------------- Plateformes //

                elt = this.platforms.create(tmp[0], tmp[1], PLATFORM);
                elt.anchor.set(0.5, 1);
                elt.angle = j;
                elt.alpha = inac;
                elt.calculLvl = i;
                elt.calculDeg = j;

                // Si on revient d'un test, il faut réafficher les éléments choisis
                if (edited_lvl.edited) {
                    for (var val in edited_lvl.plateformes) {
                        if (
                            edited_lvl.plateformes[val][0] == elt.calculDeg &&
                            edited_lvl.plateformes[val][1] == elt.calculLvl
                        )
                            elt.alpha = 1;
                    }
                }

                // ---------------------------------------------------------- //
                // ---------------------------------------------------------- //
                // --------------------------------------------------- Pièges //

                elt = this.traps.create(tmp[0], tmp[1], TRAP);
                elt.anchor.set(0.5, 1);
                elt.angle = tmp[2];
                elt.alpha = 0;
                elt.calculLvl = i;
                elt.calculDeg = j;

                if (edited_lvl.edited) {
                    for (var val in edited_lvl.pieges) {
                        if (edited_lvl.pieges[val][0] == elt.calculDeg && edited_lvl.pieges[val][1] == elt.calculLvl)
                            elt.alpha = 1;
                    }
                }

                // ---------------------------------------------------------- //
                // ---------------------------------------------------------- //
            }
        }

        // ------------------------------------------------------------------ //
        // ---------------------------- Remise en place des étoiles au besoin //

        if (edited_lvl.edited) {
            for (var val in edited_lvl.etoiles) {
                rayon = (edited_lvl.etoiles[val][1] + 0.5) * plataille + BASE_SIZE / 6;

                tmp = polarToCartesian(edited_lvl.etoiles[val][0], rayon);

                var elt = this.stars.create(tmp[0], tmp[1], STAR);

                elt.angle = tmp[2];
                elt.anchor.set(0.6);
                elt.calculLvl = edited_lvl.etoiles[val][1];
                elt.calculDeg = edited_lvl.etoiles[val][0];
            }
        }

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
    },
    update: function() {
        this.etoile.angle += 4;

        // ------------------------------------------------------------------ //
        // ---------------------- Calcul de la position de l'"étoile-curseur" //

        if (this.etoile_pos.alpha > 0) {
            const x_pointer = this.game.input.x * invert_redim - this.general.x;
            const y_pointer = this.game.input.y * invert_redim - this.general.y;
            const tmp = this.unPeuDeTrigo(x_pointer, y_pointer);

            const position = polarToCartesian(tmp[1], tmp[0]);

            this.etoile_pos.x = position[0];
            this.etoile_pos.y = position[1];
            this.etoile_pos.angle = tmp[1];
            this.etoile_pos.calculLvl = (tmp[0] - BASE_SIZE / 6) / plataille - 0.5;
            this.etoile_pos.calculDeg = tmp[1];
        }

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
        // --------------------------------------------------- Retour au menu //

        if (this.esc_key.isDown) {
            this.redimensionne(1);
            edited_lvl.edited = false;
            this.game.state.start('Menu');
        }

        // ------------------------------------------------------------------ //
        // ------------------------------------------------------------------ //
    },
    unPeuDeTrigo: function(x, y) {
        // Pour l'étoile

        // Dans cette fonction on renvoie une position en valeur trigonométrique
        // en accord avec le nombre de niveau choisis et arrondi au degrée.

        let rayon = Math.sqrt(x * x + y * y);

        // tangente de l'angle = opposé / adjacent
        const radian = Math.atan(y / x);

        let degrees = radian * pi180_invers + 90;

        // On a les degrees sur de 0 à 180 pour chaque face du cercle
        // Donc si on est sur la face gauche, on ajoute 180°

        if (x < 0) degrees += 180;

        // Dépassement
        if (rayon < BASE_SIZE / 6) rayon = BASE_SIZE / 6 + plataille / 2;
        else if (rayon > BASE_SIZE / 6 + PLATFORMS_HEIGHT_NUMBER * plataille)
            rayon = BASE_SIZE / 6 + PLATFORMS_HEIGHT_NUMBER * plataille + plataille / 2;
        // Maintenant on arrondi tout
        else
            rayon =
                Math.round((rayon - BASE_SIZE / 6 - plataille / 2) / plataille) * plataille +
                BASE_SIZE / 6 +
                plataille / 2;

        degrees = Math.round(degrees);

        return [rayon, degrees];
    },
    redimensionne: function(s) {
        // Redimensionnement de la fenêtre en fonction de la hauteur (rayon)

        const s_invers = 1 / s;

        this.game.camera.scale.y = s;
        this.game.camera.scale.x = s;

        this.general.x += (BASE_SIZE * s_invers * (1 - s)) / 2;
        this.general.y += (BASE_SIZE * s_invers * (1 - s)) / 2;

        invert_redim = s_invers;
    },
    render: function() {},
};

// On déclare les fonctions à l'extérieur, puisque lors de l'appel on est
// déjà dans une fonction ...
function alpha(sprite) {
    sprite.alpha = sprite.alpha > alph ? alph : 1;
}

function over(sprite) {
    sprite.alpha = sprite.alpha < alph ? alph : 1;
}

function out(sprite) {
    sprite.alpha = sprite.alpha > alph ? 1 : inac;
}