// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const gaujeRouter = require('./routes/gauje');
const authRouter = require('./routes/auth');

const app = express();

// 뷰 엔진
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 바디 파서
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 정적 파일 (CSS 등)
app.use(express.static(path.join(__dirname, 'public')));

// 세션 설정
app.use(session({
  secret: 'gauje-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// 모든 EJS에서 currentUser 사용 가능하게
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// 루트 진입 시
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/gauje/free');
  }
  return res.redirect('/auth/login');
});

// 라우터
app.use('/auth', authRouter);
app.use('/gauje', gaujeRouter);

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send(err.message || 'Server Error');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
