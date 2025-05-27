// Phaserゲームの設定
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d', // ゲーム画面の背景色
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 }, // 少し強めの重力
            debug: false // trueにすると当たり判定の枠などが表示される
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ゲームインスタンスの作成
const game = new Phaser.Game(config);

// グローバル変数 (シーン間で共有したい場合や、アクセスしやすくするため)
let player;
let sandbag;
let platforms;
let cursors;
let spaceKey;
let distanceText;
let initialSandbagX;
let isSandbagHit = false; // サンドバッグが一度でもヒットされたか
let sandbagHitVelocityX = 800; // サンドバッグを吹っ飛ばすX方向の初速
let sandbagHitVelocityY = -300; // サンドバッグを吹っ飛ばすY方向の初速（上向き）

// アセットを読み込む関数
function preload() {
    // プレースホルダーとして四角形を描画するための機能を使うので、画像読み込みは不要
    // もし画像を使いたい場合はコメントアウトを解除してパスを指定
    // this.load.image('ground', 'assets/platform.png');
    // this.load.image('player', 'assets/player.png');
    // this.load.image('sandbag', 'assets/sandbag.png');
}

// ゲームオブジェクトを作成する関数
function create() {
    // 地面 (静的グループ)
    platforms = this.physics.add.staticGroup();
    // 地面を画面下部に描画 (長方形で代用)
    // (x, y, width, height, fillColor)
    platforms.add(this.add.rectangle(config.width / 2, config.height - 20, config.width, 40, 0x666666));
    // refreshBodyはstaticGroupには不要なのでコメントアウト、代わりに個々のオブジェクトに設定
    // platforms.create(config.width / 2, config.height - 20, 'ground').setScale(2).refreshBody();

    // プレイヤー (長方形で代用)
    player = this.physics.add.sprite(100, config.height - 100, null);
    player.setSize(32, 64); // 当たり判定のサイズ
    player.setCollideWorldBounds(true); // 画面端で止まる
    // プレイヤーの見た目を描画
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x00ff00, 1); // 緑色
    playerGraphics.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    playerGraphics.depth = 1; // 表示順を前面に
    this.add.container(player.x, player.y, playerGraphics).setSize(player.width, player.height); // グラフィックをコンテナに入れてプレイヤーに追従させる
    player.setData('graphics', playerGraphics); // グラフィックをプレイヤーデータに保存

    // サンドバッグ (長方形で代用)
    sandbag = this.physics.add.sprite(300, config.height - 100, null);
    sandbag.setSize(50, 80); // 当たり判定のサイズ
    sandbag.setCollideWorldBounds(true);
    sandbag.setBounce(0.3); // 少し跳ね返る
    sandbag.setDragX(50); // X方向の空気抵抗/摩擦
    initialSandbagX = sandbag.x; // サンドバッグの初期X座標を保存
    // サンドバッグの見た目を描画
    const sandbagGraphics = this.add.graphics();
    sandbagGraphics.fillStyle(0xff0000, 1); // 赤色
    sandbagGraphics.fillRect(-sandbag.width / 2, -sandbag.height / 2, sandbag.width, sandbag.height);
    sandbagGraphics.depth = 1;
    this.add.container(sandbag.x, sandbag.y, sandbagGraphics).setSize(sandbag.width, sandbag.height);
    sandbag.setData('graphics', sandbagGraphics);

    // 衝突設定
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(sandbag, platforms);
    // プレイヤーとサンドバッグの衝突検知 (攻撃判定はupdate内で行う)
    this.physics.add.overlap(player, sandbag, handlePlayerSandbagOverlap, null, this);

    // 入力設定
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 飛距離表示用のテキスト
    distanceText = this.add.text(16, 16, '飛距離: 0 m', { fontSize: '24px', fill: '#ffffff' });

    // リセットボタン (簡易)
    const resetButton = this.add.text(config.width - 100, 16, 'リセット', { fontSize: '20px', fill: '#00ffff' })
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart(); // シーンをリスタート
            isSandbagHit = false;
        });
}

// プレイヤーとサンドバッグが重なった時の処理
function handlePlayerSandbagOverlap(player, sandbag) {
    // スペースキーが押された瞬間に攻撃
    if (Phaser.Input.Keyboard.JustDown(spaceKey) && !isSandbagHit) {
        console.log("Attack!");
        // サンドバッグを吹っ飛ばす
        sandbag.setVelocity(sandbagHitVelocityX, sandbagHitVelocityY);
        isSandbagHit = true; // ヒット済みフラグを立てる
        initialSandbagX = sandbag.x; // ヒットした瞬間のX座標を基準にする
    }
}

// 毎フレーム呼ばれる関数
function update() {
    // プレイヤーの操作
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-350);
    }

    // プレイヤーの見た目を追従 (コンテナを使わない場合)
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


    // 飛距離の計算と表示
    if (isSandbagHit) {
        // サンドバッグがほぼ静止したら飛距離を確定 (X方向の速度で判定)
        // Y方向は地面に何度もバウンドする可能性があるため、X方向の動きがなくなったら、とする
        if (Math.abs(sandbag.body.velocity.x) < 1 && sandbag.body.touching.down) {
            // ここで最終的な飛距離を計算・表示しても良い
            // 今回はリアルタイムで更新し続ける
        }

        // リアルタイムで飛距離を更新
        const currentDistance = Math.abs(sandbag.x - initialSandbagX);
        // ピクセルをメートルに変換 (10ピクセル = 1メートルとする例)
        const distanceInMeters = currentDistance / 10;
        distanceText.setText('飛距離: ' + distanceInMeters.toFixed(1) + ' m');
    } else {
        // ヒット前は初期位置からの距離を表示しないか、0mとする
        distanceText.setText('飛距離: 0 m');
    }
}