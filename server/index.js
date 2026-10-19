const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// Reactからのリクエストを受け取る設定
app.use(cors());
app.use(express.json());

// SQLiteデータベースを開く
const db = new Database('products.db');

// テーブルを作成（まだ存在しない場合のみ）
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    category TEXT NOT NULL
  );
`);

// サーバーの動作確認用
app.get('/', (req, res) => {
  res.json({ message: '商品管理アプリのバックエンドは動作しています！' });
});

 // ログインユーザーを登録するAPI
app.post('/api/register', (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({
      message: 'ログインIDとパスワードを入力してください'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'パスワードは8文字以上にしてください'
    });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(
      'INSERT INTO users (user_id, password_hash) VALUES (?, ?)'
    );

    stmt.run(userId, passwordHash);

    return res.status(201).json({
      message: 'ユーザーを登録しました'
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        message: 'このログインIDはすでに登録されています'
      });
    }

    console.error(error);
    return res.status(500).json({
      message: 'ユーザー登録に失敗しました'
    });
  }
});

// ログインAPI
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({
      message: 'ログインIDとパスワードを入力してください'
    });
  }

  try {
    const stmt = db.prepare(
      'SELECT * FROM users WHERE user_id = ?'
    );

    const user = stmt.get(userId);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        message: 'ログインIDまたはパスワードが違います'
      });
    }

    return res.status(200).json({
      message: 'ログインに成功しました'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'ログイン処理に失敗しました'
    });
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
