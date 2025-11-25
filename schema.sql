-- DB 생성
CREATE DATABASE gauje_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE gauje_db;

-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- users 테이블 (로그인용)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,  -- 로그인 아이디
  pass VARCHAR(255) NOT NULL,            -- 평문 비밀번호 (과제용)
  display_name VARCHAR(50) NOT NULL,     -- 화면에 표시되는 이름
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- posts 테이블 (게시판)
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                       -- FK → users.id
  board_type ENUM('free', 'notice') NOT NULL, -- 자유/공지
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  views INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_board_type_created_at (board_type, created_at),
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
);

-- 샘플 유저
INSERT INTO users (username, pass, display_name) VALUES
('admin', 'adminpass', '관리자'),
('user1', '1111',      '홍길동'),
('user2', '2222',      '임꺽정');

-- 샘플 게시글
INSERT INTO posts (user_id, board_type, title, content) VALUES
(1, 'notice', '서버 점검 안내', '내일 새벽 2시부터 3시까지 서버 점검이 진행됩니다.'),
(1, 'notice', '공지사항 테스트', '공지사항 게시판 테스트 글입니다.'),
(2, 'free',   '안녕하세요, 홍길동입니다', '자유 게시판 테스트 글입니다. 반갑습니다.'),
(2, 'free',   '질문 있어요', '게시판 기능 관련해서 궁금한 점이 있습니다.'),
(3, 'free',   '첫 글 남겨요', '임꺽정의 첫 번째 테스트 글입니다.');

-- gauje_db 를 사용하는 전용 계정 예시
CREATE USER 'gaujeuser'@'X.X.X.X' IDENTIFIED BY '비밀번호';

-- 이 계정에 gauje_db 전체 권한 부여
GRANT ALL PRIVILEGES ON gauje_db.* TO 'gaujeuser'@'X.X.X.X';

FLUSH PRIVILEGES;
