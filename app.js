const express = require('express');
const morgan = require('morgan');
const connection = require('./database/connection');
const { body, param, validationResult } = require('express-validator');

const app = express();

app.set('port', process.env.PORT || 3333);

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('main');
});

// 회원 가입
app.post('/join', 
    [
        body('name').notEmpty().isString().withMessage('이름을 입력해주세요.'),
        body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'),
        body('pwd').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, pwd } = req.body;

        try {
            await connection.execute(
                'INSERT INTO users (name, email, pwd) VALUES (?, ?, ?)',
                [name, email, pwd]
            );
            res.status(201).json({ message: `${name}님, 반갑습니다!`});
        } catch (error) {
            console.error(error);
            res.json({ message: '서버 오류가 발생했습니다.'});
        }
});

// 로그인
app.post('/login',
    [
        body('email').notEmpty().isEmail().withMessage('유효한 이메일을 입력해주세요.'),
        body('pwd').notEmpty().withMessage('비밀번호를 입력해주세요.')
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, pwd } = req.body;

        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE email = ? AND pwd = BINARY ?',[email, pwd]);

            if(rows.length > 0) {
                console.log(rows[0]);
                res.json({ message: `${rows[0].name}님, 반갑습니다!` });
            } else {
                res.status(404).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            }
        } catch(error) {
            console.error(error);
            res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
});

// 개별 회원 조회
app.get('/users/:id',
    param('id').notEmpty().isInt().withMessage('정수 id를 입력해주세요.'), 
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const reqId = parseInt(req.params.id);

        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [reqId]);
            
            if(rows.length > 0) {
                res.status(200).json(rows[0]);
            } else {
                res.status(404).json({ message: '잘못된 요청입니다.' });
            }
        } catch(error) {
            console.error(error);
            res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
});

// 전체 회원 조회
app.get('/users', async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM users');
        if (rows.length > 0) {
            res.json(rows);
        } else {
            res.status(404).json({ message: '등록된 회원정보가 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 회원 탈퇴
app.delete('/users/:id', 
    param('id').notEmpty().isInt().withMessage('정수 id를 입력해주세요.'),
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const reqId = parseInt(req.params.id);

        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [reqId]);

            if(rows.length > 0) {
                await connection.execute('DELETE FROM users WHERE id = ?', [reqId]);
                res.json({ message: `${rows[0].name}님, 회원탈퇴 되었습니다.` });
            } else {
                res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
            }
        } catch(error) {
            console.error(error);
            res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
});

// 회원 비밀번호 수정
app.put('/users/:id',
    [
        param('id').notEmpty().withMessage('id를 입력해주세요.').isInt().withMessage('정수 id를 입력해주세요.'),
        body('newPwd').notEmpty().withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const reqId = parseInt(req.params.id);
        const newPwd = req.body.newPwd;

        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [reqId]);

            if(rows.length > 0) {
                await connection.execute('UPDATE users SET pwd = ? WHERE id = ?', [newPwd, reqId]);
                res.json({ message: `${rows[0].name}님, 비밀번호가 변경되었습니다.` });
            } else {
                res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
            }
        } catch(error) {
            console.error(error);
            es.status(500).json({ message: '서버 오류가 발생했습니다.' });
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