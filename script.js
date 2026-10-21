// Snake

const jeu = document.querySelector(`#jeu`)
const ctx = jeu.getContext(`2d`)

const PARAMETRES = {
    joueurs: {
        min: 1,
        max: 4,
        defaut: 2,
    },
    largeur: {
        min: 8,
        max: 64,
        defaut: 32,
    },
    longueur: {
        min: 8,
        max: 64,
        defaut: 32,
    },
    vitesse: {
        min: 1,
        max: 20,
        defaut: 5,
    },
}

const DIRECTIONS = {
    haut: { x: 0, y: -1 },
    bas: { x: 0, y: 1 },
    gauche: { x: -1, y: 0 },
    droite: { x: 1, y: 0 },
}

// Touches (event.code, donc position physique) : haut, gauche, bas, droite
const CONTROLES = [
    { nom: `WASD`, haut: `KeyW`, gauche: `KeyA`, bas: `KeyS`, droite: `KeyD` },
    { nom: `OKL;`, haut: `KeyO`, gauche: `KeyK`, bas: `KeyL`, droite: `Semicolon` },
    { nom: `Flèches`, haut: `ArrowUp`, gauche: `ArrowLeft`, bas: `ArrowDown`, droite: `ArrowRight` },
    { nom: `8456`, haut: `Numpad8`, gauche: `Numpad4`, bas: `Numpad5`, droite: `Numpad6` },
]

const COULEURS_DAMIER = [`#1a1a1a`, `#262626`]
const COULEURS_SERPENTS = [`#4caf50`, `#2196f3`, `#ff9800`, `#e91e63`]

function lire_parametres() {
    const query = new URLSearchParams(window.location.search)
    const resultat = {}

    for (const [nom, regles] of Object.entries(PARAMETRES)) {
        const valeur = query.get(nom)
        const nombre = valeur !== null && valeur.trim() !== ""
            ? Number(valeur)
            : NaN

        // Arrondi : une case ou un joueur ne peut pas être décimal
        resultat[nom] = Number.isFinite(nombre)
            ? Math.round(Math.min(regles.max, Math.max(regles.min, nombre)))
            : regles.defaut
    }

    return resultat
}

const parametres = lire_parametres()

// Taille d'une case en pixels : le canvas reste dans 1024px au maximum,
// et ses proportions suivent celles du plateau (cases toujours carrées)
const taille_case = Math.floor(1024 / Math.max(parametres.largeur, parametres.longueur))

jeu.width = parametres.largeur * taille_case
jeu.height = parametres.longueur * taille_case

jeu.style.setProperty(
    `--ratio`,
    parametres.largeur / parametres.longueur
)

class Serpent {
    constructor(numero, x, y, direction, couleur, controles) {
        this.numero = numero
        this.direction = direction
        this.couleur = couleur
        this.controles = controles

        // segments[0] est la tête
        this.segments = [{ x, y }]
    }

    dessiner(ctx, taille_case) {
        const marge = taille_case * 0.1
        const taille = taille_case - marge * 2

        ctx.fillStyle = this.couleur

        for (const segment of this.segments) {
            ctx.fillRect(
                segment.x * taille_case + marge,
                segment.y * taille_case + marge,
                taille,
                taille
            )
        }

        // Un œil sur la tête, décalé dans le sens de la direction
        const tete = this.segments[0]

        ctx.fillStyle = `black`
        ctx.beginPath()
        ctx.arc(
            (tete.x + 0.5 + this.direction.x * 0.25) * taille_case,
            (tete.y + 0.5 + this.direction.y * 0.25) * taille_case,
            taille_case * 0.1,
            0,
            Math.PI * 2
        )
        ctx.fill()
    }
}

// Positions de départ des joueurs (dans l'ordre 1, 2, 3, 4) selon leur nombre :
// dans un coin, à une case de marge du bord, direction horizontale vers le centre
function positions_depart(largeur, longueur, nombre) {
    const gauche = 1
    const droite = largeur - 2
    const haut = 1
    const bas = longueur - 2

    const coins = {
        haut_gauche: { x: gauche, y: haut, direction: DIRECTIONS.droite },
        haut_droite: { x: droite, y: haut, direction: DIRECTIONS.gauche },
        bas_gauche: { x: gauche, y: bas, direction: DIRECTIONS.droite },
        bas_droite: { x: droite, y: bas, direction: DIRECTIONS.gauche },
    }

    const coins_par_nombre = {
        1: [`haut_gauche`],
        2: [`haut_gauche`, `bas_droite`],
        3: [`haut_gauche`, `haut_droite`, `bas_gauche`],
        4: [`haut_gauche`, `haut_droite`, `bas_gauche`, `bas_droite`],
    }

    return coins_par_nombre[nombre].map(nom => coins[nom])
}

// Renvoie, pour chaque joueur, la liste des contrôles qui lui sont attribués
function attribuer_controles(nombre) {
    if (nombre === 1) {
        return [CONTROLES]
    }

    if (nombre === 2) {
        return [
            [CONTROLES[0], CONTROLES[1]],
            [CONTROLES[2], CONTROLES[3]],
        ]
    }

    return CONTROLES.slice(0, nombre).map(controle => [controle])
}

function creer_serpents(nombre) {
    const departs = positions_depart(parametres.largeur, parametres.longueur, nombre)
    const controles = attribuer_controles(nombre)

    return Array.from({ length: nombre }, (_, i) => new Serpent(
        i + 1,
        departs[i].x,
        departs[i].y,
        departs[i].direction,
        COULEURS_SERPENTS[i],
        controles[i]
    ))
}

const serpents = creer_serpents(parametres.joueurs)

function dessiner_damier() {
    for (let y = 0; y < parametres.longueur; y++) {
        for (let x = 0; x < parametres.largeur; x++) {
            ctx.fillStyle = COULEURS_DAMIER[(x + y) % 2]
            ctx.fillRect(x * taille_case, y * taille_case, taille_case, taille_case)
        }
    }
}

function dessiner() {
    dessiner_damier()

    for (const serpent of serpents) {
        serpent.dessiner(ctx, taille_case)
    }
}

dessiner()
