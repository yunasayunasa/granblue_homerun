// game.js (修正案 - タッチ操作追加)

// Phaserゲームの設定 (変更なし)
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let sandbag;
let platforms;
let cursors; // PCキーボード用
let spaceKey; // PCキーボード用
let distanceText;
let initialSandbagX;
let isSandbagHit = false;
let sandbagHitVelocityX = 800;
let sandbagHitVelocityY = -300;

// スマホ操作用のフラグ
let moveLeft = false;
let moveRight = false;
let jumpAction = false;
let attackAction = false;


function preload() {
    // (変更なし)
}

function create() {
    platforms = this.physics.add.staticGroup();
    platforms.add(this.add.rectangle(config.width / 2, config.height - 20, config.width, 40, 0x666666));

    player = this.physics.add.sprite(100, config.height - 100, null);
    player.setSize(32, 64);
    player.setCollideWorldBounds(true);
    const playerGraphics = this.add.graphics().fillStyle(0x00ff00, 1).fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    this.add.container(player.x, player.y, playerGraphics).setSize(player.width, player.height);
    player.setData('graphics', playerGraphics);


    sandbag = this.physics.add.sprite(300, config.height - 100, null);
    sandbag.setSize(50, 80);
    sandbag.setCollideWorldBounds(true);
    sandbag.setBounce(0.3);
    sandbag.setDragX(50);
    initialSandbagX = sandbag.x;
    const sandbagGraphics = this.add.graphics().fillStyle(0xff0000, 1).fillRect(-sandbag.width / 2, -sandbag.height / 2, sandbag.width, sandbag.height);
    this.add.container(sandbag.x, sandbag.y, sandbagGraphics).setSize(sandbag.width, sandbag.height);
    sandbag.setData('graphics', sandbagGraphics);


    this.physics.add.collider(player, platforms);
    this.physics.add.collider(sandbag, platforms);
    this.physics.add.overlap(player, sandbag, handlePlayerSandbagOverlap, null, this);

    // PCキーボード入力設定
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    distanceText = this.add.text(16, 16, '飛距離: 0 m', { fontSize: '24px', fill: '#ffffff' });

    const resetButton = this.add.text(config.width - 100, 16, 'リセット', { fontSize: '20px', fill: '#00ffff', backgroundColor: '#555555', padding: { x:5, y:5 }})
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart();
            isSandbagHit = false;
            // スマホ操作フラグもリセット
            moveLeft = false;
            moveRight = false;
            jumpAction = false;
            attackAction = false;
        });

    // --- スマホ用タッチボタンの作成 ---
    const buttonSize = 80;
    const buttonAlpha = 0.5; // ボタンの透明度
    const buttonY = config.height - buttonSize / 2 - 20; // ボタンのY座標 (画面下部)

    // 左移動ボタン
    const leftButton = this.add.rectangle(buttonSize, buttonY, buttonSize, buttonSize, 0xcccccc, buttonAlpha)
        .setInteractive()
        .on('pointerdown', () => { moveLeft = true; })
        .on('pointerup', () => { moveLeft = false; })
        .on('pointerout', () => { moveLeft = false; }); // ボタンから指が離れた場合も考慮
    this.add.text(leftButton.x, leftButton.y, '◀', { fontSize: '40px', fill: '#000'}).setOrigin(0.5);


    // 右移動ボタン
    const rightButton = this.add.rectangle(buttonSize * 2.5, buttonY, buttonSize, buttonSize, 0xcccccc, buttonAlpha)
        .setInteractive()
        .on('pointerdown', () => { moveRight = true; })
        .on('pointerup', () => { moveRight = false; })
        .on('pointerout', () => { moveRight = false; });
    this.add.text(rightButton.x, rightButton.y, '▶', { fontSize: '40px', fill: '#000'}).setOrigin(0.5);


    // ジャンプボタン (画面右側)
    const jumpButton = this.add.rectangle(config.width - buttonSize * 2.5, buttonY, buttonSize, buttonSize, 0xcccccc, buttonAlpha)
        .setInteractive()
        .on('pointerdown', () => { jumpAction = true; });
        // jumpActionは押した瞬間だけtrueにしたいので、pointerupでfalseにする必要はない(updateで処理後にfalseにする)
    this.add.text(jumpButton.x, jumpButton.y, '▲', { fontSize: '40px', fill: '#000'}).setOrigin(0.5);


    // 攻撃ボタン (画面右側)
    const attackButton = this.add.rectangle(config.width - buttonSize, buttonY, buttonSize, buttonSize, 0xff8888, buttonAlpha) // 少し色を変える
        .setInteractive()
        .on('pointerdown', () => { attackAction = true; });
        // attackActionも押した瞬間だけtrueにしたいので、pointerupでfalseにする必要はない(updateで処理後にfalseにする)
    this.add.text(attackButton.x, attackButton.y, 'ATK', { fontSize: '30px', fill: '#000'}).setOrigin(0.5);

    // ボタンがUIレイヤーになるようにスクロールの影響を受けないようにする (オプション)
    // leftButton.setScrollFactor(0);
    // rightButton.setScrollFactor(0);
    // jumpButton.setScrollFactor(0);
    // attackButton.setScrollFactor(0);
    // (今回は固定画面なので不要)
}

function handlePlayerSandbagOverlap(player, sandbag) {
    // スペースキー(PC) または 攻撃ボタン(スマホ) が押された瞬間に攻撃
    if ((Phaser.Input.Keyboard.JustDown(spaceKey) || attackAction) && !isSandbagHit) {
        console.log("Attack!");
        sandbag.setVelocity(sandbagHitVelocityX, sandbagHitVelocityY);
        isSandbagHit = true;
        initialSandbagX = sandbag.x;
        attackAction = false; // 攻撃実行後はフラグを戻す
    }
}

function update() {
    // プレイヤーの操作 (PCキーボードとスマホタッチの両方に対応)
    if (cursors.left.isDown || moveLeft) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown || moveRight) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }

    if ((cursors.up.isDown || jumpAction) && player.body.touching.down) {
        player.setVelocityY(-350);
    }
    jumpAction = false; // ジャンプ実行後はフラグを戻す（連続ジャンプ防止のため）

    // 攻撃フラグは handlePlayerSandbagOverlap で処理するのでここではリセットしない
    // attackAction = false; (handlePlayerSandbagOverlap内でリセット)


    const playerGraphics = player.getData('graphics');
    if (playerGraphics) {
        playerGraphics.x = player.x;
        playerGraphics.y = player.y;
    }
    const sandbagGraphics = sandbag.getData('graphics');
    if (sandbagGraphics) {
        sandbagGraphics.x = sandbag.x;
        sandbagGraphics.y = sandbag.y;
    }

    if (isSandbagHit) {
        const currentDistance = Math.abs(sandbag.x - initialSandbagX);
        const distanceInMeters = currentDistance / 10;
        distanceText.setText('飛距離: ' + distanceInMeters.toFixed(1) + ' m');
    } else {
        distanceText.setText('飛距離: 0 m');
    }
}