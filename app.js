const express = require('express');
const morgan = require('morgan');

const app = express();

app.set('port', process.env.PORT || 3333);

app.use(express.json());
app.use(morgan('dev'));

const db = new Map();
let keyId = 1;

app.get('/', (req, res) => {
    res.send('main');
});

// 회원 가입
app.post('/join', (req, res) => {
    const userObj = req.body;
    const userName = userObj.name;
    const userId = userObj.id;
    const userPwd = userObj.pwd;

    if(userName && userId && userPwd) {
        db.set(keyId++, userObj);
        res.status(201).json({ message: `${userName}님, 반갑습니다!` });
    } else {
        res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

// 로그인
app.post('/login', (req, res) => {
    const { id, pwd } = req.body;

    const dbArray = Array.from(db.values());
    if(dbArray.some((user) => user.id === id && user.pwd === pwd)) {
        res.json({ message: `${id}님, 반갑습니다!` });
    } else {
        res.status(404).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
});

// 개별 회원 조회
app.get('/users/:id', (req, res) => {
    const reqId = parseInt(req.params.id);
    const userObj = db.get(reqId);
    
    if(userObj) {
        res.json(userObj);
    } else {
        res.status(404).json({ message: '잘못된 요청입니다.' })
    }
});

// 전체 회원 조회
app.get('/users', (req, res) => {
    if(db.size) {
        res.json(Array.from(db.values()));
    } else {
        res.status(404).json({ message: '등록된 회원정보가 없습니다.' });
    }
});

// 회원 탈퇴
app.delete('/users/:id', (req, res) => {
    const reqId = parseInt(req.params.id);
    const userObj = db.get(reqId);
    if(db.get(reqId)) {
        db.delete(reqId);
        res.json({ message: `${userObj.name}님, 회원탈퇴 되었습니다.` });
    } else {
        res.status(404).json({ message: '등록된 회원정보가 없습니다.' });
    }
});

app.use((req, res, next) => {
    res.status(404).send('404 ERROR');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.send('ERROR');
})

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 서버 대기 중');
})