// routes/gauje.js
const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * 로그인 필수
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

// 이 아래의 모든 /gauje 경로에 로그인 적용
router.use(requireLogin);

const BOARD_TYPES = ['free', 'notice'];

function getBoardInfo(boardType) {
  if (!BOARD_TYPES.includes(boardType)) {
    const err = new Error('존재하지 않는 게시판입니다.');
    err.status = 404;
    throw err;
  }

  return {
    type: boardType,
    title: boardType === 'free' ? '자유 게시판' : '공지사항',
  };
}

// 목록 + 검색 + 페이지네이션
router.get('/:boardType', async (req, res, next) => {
  try {
    const { boardType } = req.params;
    const { type, title: boardTitle } = getBoardInfo(boardType);

    const page = parseInt(req.query.page || '1', 10);
    const pageSize = 10;
    const search = req.query.q || '';
    const offset = (page - 1) * pageSize;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM posts p
       WHERE p.board_type = ? AND p.title LIKE ?`,
      [type, `%${search}%`]
    );
    const totalCount = countRows[0].cnt;
    const totalPages = Math.ceil(totalCount / pageSize);

    const [rows] = await db.query(
      `SELECT p.id,
              p.title,
              u.display_name AS writer,
              p.views,
              p.created_at
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.board_type = ? AND p.title LIKE ?
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [type, `%${search}%`, pageSize, offset]
    );

    const startNumber = totalCount - offset;

    res.render('list', {
      boardType: type,
      boardTitle,
      posts: rows,
      page,
      totalPages,
      q: search,
      startNumber,
    });
  } catch (err) {
    next(err);
  }
});

// 글쓰기 폼
router.get('/:boardType/new', (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);

    res.render('form', {
      boardType: info.type,
      boardTitle: info.title,
      post: null,
      action: 'create',
    });
  } catch (err) {
    next(err);
  }
});

// 글 등록
router.post('/:boardType', async (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);
    const { title, content } = req.body;
    const userId = req.session.user.id;

    await db.query(
      'INSERT INTO posts (board_type, title, content, user_id) VALUES (?, ?, ?, ?)',
      [info.type, title, content, userId]
    );

    res.redirect(`/gauje/${info.type}`);
  } catch (err) {
    next(err);
  }
});

// 글 상세보기 + 조회수 증가
router.get('/:boardType/:id', async (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);
    const id = parseInt(req.params.id, 10);

    await db.query(
      'UPDATE posts SET views = views + 1 WHERE id = ? AND board_type = ?',
      [id, info.type]
    );

    const [rows] = await db.query(
      `SELECT p.*,
              u.display_name AS writer
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.board_type = ?`,
      [id, info.type]
    );

    if (rows.length === 0) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    res.render('detail', {
      boardType: info.type,
      boardTitle: info.title,
      post: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// 수정 폼 (작성자 본인만)
router.get('/:boardType/:id/edit', async (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;

    const [rows] = await db.query(
      `SELECT p.*,
              u.display_name AS writer
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.board_type = ? AND p.user_id = ?`,
      [id, info.type, userId]
    );

    if (rows.length === 0) {
      return res.status(403).send('수정 권한이 없습니다.');
    }

    res.render('form', {
      boardType: info.type,
      boardTitle: info.title,
      post: rows[0],
      action: 'edit',
    });
  } catch (err) {
    next(err);
  }
});

// 글 수정 처리
router.post('/:boardType/:id/edit', async (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;
    const { title, content } = req.body;

    const [result] = await db.query(
      `UPDATE posts
       SET title = ?, content = ?
       WHERE id = ? AND board_type = ? AND user_id = ?`,
      [title, content, id, info.type, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).send('수정 권한이 없습니다.');
    }

    res.redirect(`/gauje/${info.type}/${id}`);
  } catch (err) {
    next(err);
  }
});

// 글 삭제
router.post('/:boardType/:id/delete', async (req, res, next) => {
  try {
    const info = getBoardInfo(req.params.boardType);
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user.id;

    const [result] = await db.query(
      'DELETE FROM posts WHERE id = ? AND board_type = ? AND user_id = ?',
      [id, info.type, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).send('삭제 권한이 없습니다.');
    }

    res.redirect(`/gauje/${info.type}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
