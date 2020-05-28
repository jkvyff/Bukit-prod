let express = require("express");
let router = express.Router();
let pool = require("./db");

router.get("/hello", (req, res) => {
  res.json("hello world");
});

router.get("/api/get/url", (req, res, next) => {
  console.log("hello", req.body, req.query, req.headers);
  console.log(res);
});

/*
  Resources
*/

router.get("/api/get/allresources", (req, res, next) => {
  pool.query(
    "SELECT * FROM resources ORDER BY date_created DESC",
    (q_err, q_res) => {
      res.json(q_res.rows);
    }
  );
});

router.post("/api/post/resourcetodb", (req, res, next) => {
  const body_vector = req.body.body;
  const title_vector = req.body.title;
  const username_vector = req.body.username;

  const search_vector = [title_vector, body_vector, username_vector];
  const values = [
    req.body.title,
    req.body.body,
    search_vector,
    req.body.uid,
    req.body.username,
  ];
  pool.query(
    `INSERT INTO
              resources(title, body, search_vector, user_id, author, date_created)
              VALUES($1, $2, to_tsvector($3), $4, $5, NOW())`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

router.put("/api/put/resourcetodb", (req, res, next) => {
  const values = [
    req.body.title,
    req.body.body,
    req.body.uid,
    req.body.rid,
    req.body.username,
  ];
  pool.query(
    `Update resources SET title=$1, body=$2, user_id=$3, author=$5, date_created=NOW() 
     WHERE rid = $4`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
    }
  );
});

router.delete("/api/delete/resourcecomments", (req, res, next) => {
  const resource_id = req.body.resource_id;
  pool.query(
    `DELETE FROM comments
     WHERE resource_id = $1`,
    [resource_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.delete("/api/delete/resource", (req, res, next) => {
  const resource_id = req.body.resource_id;
  pool.query(
    `DELETE FROM resources WHERE rid = $1`,
    [resource_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

/*
  Comments
*/

router.get("/api/get/allresourcecomments", (req, res, next) => {
  const resource_id = req.query.resource_id;
  console.log(resource_id);
  pool.query(
    `SELECT * FROM comments
    WHERE resource_id=$1`,
    [resource_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.post("/api/post/commenttodb", (req, res, next) => {
  const values = [
    req.body.comment,
    req.body.user_id,
    req.body.username,
    req.body.resource_id,
  ];
  pool.query(
    `INSERT INTO comments(comment, user_id, author, resource_id, date_created)
    VALUES($1, $2, $3, $4, NOW() )`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.put("/api/put/commenttodb", (req, res, next) => {
  const values = [
    req.body.comment,
    req.body.user_id,
    req.body.resource_id,
    req.body.username,
    req.body.cid,
  ];
  pool.query(
    `UPDATE comments SET 
     comment=$1, user_id=$2, resource_id=$3, author=$4, date_created=NOW()
     WHERE cid=$5`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.delete("/api/delete/comment", (req, res, next) => {
  const cid = req.body.cid;
  pool.query(
    `DELETE FROM comments
     WHERE cid=$1`,
    [cid],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

/*
 Likes
*/

router.put("/api/put/likes", (req, res, next) => {
  const uid = [req.body.uid];
  const resource_id = req.body.resource_id;
  const values = [uid, resource_id];

  pool.query(
    `UPDATE resources
              SET like_user_id = like_user_id || $1, likes = likes + 1
              WHERE NOT (like_user_id @> $1)
              AND rid = ($2)`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

/*
 User Profile
*/

router.post("/api/post/userprofiletodb", (req, res, next) => {
  const values = [
    req.body.profile.nickname,
    req.body.profile.email,
    req.body.profile.email_verified,
  ];
  pool.query(
    `INSERT INTO users(username, email, email_verified, date_created)
     VALUES($1, $2, $3, NOW())
     ON CONFLICT DO NOTHING`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.get("/api/get/alluser", (req, res, next) => {
  pool.query(`SELECT * FROM users`, (q_err, q_res) => {
    res.json(q_res.rows);
    console.log(q_err);
  });
});

router.get("/api/get/userprofiletodb", (req, res, next) => {
  const email = req.query.email;
  console.log("hello", email);
  pool.query(
    `SELECT * FROM users
     WHERE email=$1`,
    [email],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

router.get("/api/get/userresources", (req, res, next) => {
  const user_id = req.body.userid;
  pool.query(
    `SELECT * FROM resources
     WHERE user_id=$1`,
    [user_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    }
  );
});

/*
 Search Resources
*/

router.get("/api/get/searchresource", (req, res, next) => {
  search_query = req.query.search_query;
  pool.query(
    `SELECT * FROM resources
              WHERE search_vector @@ to_tsquery($1)`,
    [search_query],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    }
  );
});

/* 
 Retrieve another users profile from db based on username
*/

router.get("/api/get/otheruserprofilefromdb", (req, res, next) => {
  const username = req.query.username;
  pool.query(
    `SELECT * FROM users
              WHERE username = $1`,
    [username],
    (q_err, q_res) => {
      res.json(q_res.rows);
    }
  );
});

/* 
 Get another user's resources based on username
*/

router.get("/api/get/otheruserresources", (req, res, next) => {
  const username = req.query.username;
  pool.query(
    `SELECT * FROM resources
              WHERE author = $1`,
    [username],
    (q_err, q_res) => {
      res.json(q_res.rows);
    }
  );
});

/* 
 Send Message to db
*/

router.post("/api/post/messagetodb", (req, res, next) => {
  const from_username = req.body.message_sender;
  const to_username = req.body.message_to;
  const title = req.body.title;
  const body = req.body.body;

  const values = [from_username, to_username, title, body];
  pool.query(
    `INSERT INTO messages(message_sender, message_to, message_title, message_body, date_created)
              VALUES($1, $2, $3, $4, NOW())`,
    values,
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      console.log(q_res);
      res.json(q_res.rows);
    }
  );
});

/*
 Get another user's messages based on username
*/

router.get("/api/get/usermessages", (req, res, next) => {
  const username = req.query.username;
  console.log(username);
  pool.query(
    `SELECT * FROM messages
              WHERE message_to = $1`,
    [username],
    (q_err, q_res) => {
      res.json(q_res.rows);
    }
  );
});

/*
 Delete a message with the message id
*/

router.delete("/api/delete/usermessage", (req, res, next) => {
  const mid = req.body.mid;
  pool.query(
    `DELETE FROM messages
              WHERE mid = $1`,
    [mid],
    (q_err, q_res) => {
      if (q_err) return next(q_err);
      console.log(q_res);
      res.json(q_res.rows);
    }
  );
});

module.exports = router;
