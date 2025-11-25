// routes/auth.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// 로그인 필요할 때 사용
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

// 회원가입 폼
router.get('/register', (req, res) => {
  res.render('register');
});

// 회원가입 처리
router.post('/register', async (req, res, next) => {
  try {
    const { username, pass, display_name } = req.body;

    const [rows] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (rows.length > 0) {
      return res.send('이미 사용 중인 아이디입니다.');
    }

    const [result] = await db.query(
      'INSERT INTO users (username, pass, display_name) VALUES (?, ?, ?)',
      [username, pass, display_name]
    );

    req.session.user = {
      id: result.insertId,
      username,
      displayName: display_name,
    };

    req.session.save(() => {
      res.redirect('/gauje/free');
    });
  } catch (err) {
    next(err);
  }
});

// 로그인 폼
router.get('/login', (req, res) => {
  res.render('login');
});

// 로그인 처리
router.post('/login', async (req, res, next) => {
  try {
    const { username, pass } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.send('존재하지 않는 아이디입니다.');
    }

    const user = rows[0];

    if (pass !== user.pass) {
      return res.send('비밀번호가 올바르지 않습니다.');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
    };

    req.session.save(() => {
      res.redirect('/gauje/free');
    });
  } catch (err) {
    next(err);
  }
});

// 로그아웃
router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
});

// 프로필(이름) 수정 폼
router.get('/profile', requireLogin, (req, res) => {
  res.render('profile', { user: req.session.user });
});

// 프로필(이름) 수정 처리
router.post('/profile', requireLogin, async (req, res, next) => {
  try {
    const newName = req.body.display_name;
    const userId = req.session.user.id;

    await db.query(
      'UPDATE users SET display_name = ? WHERE id = ?',
      [newName, userId]
    );

    req.session.user.displayName = newName;

    req.session.save(() => {
      res.redirect('/gauje/free');
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
