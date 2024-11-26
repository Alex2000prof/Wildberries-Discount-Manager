const express = require('express');
const mssql = require('mssql');
const https = require('https');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Настройки базы данных
const dbConfig = {
  user: 'u1603085_Maxim',
  password: '', // Убедитесь, что пароль правильный
  server: '37.140.192.97',
  database: 'u1603085_Dite',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Включение CORS
app.use(cors());

app.get('/get-api-key/:articleID', async (req, res) => {
  const articleID = req.params.articleID;

  try {
    console.log('Подключаемся к базе данных...');
    await mssql.connect(dbConfig);
    console.log('Подключение к базе данных успешно.');

    const result = await mssql.query`
      SELECT ApiNew FROM DITE_Reporting_Shops_SettingsPercentApi api
      INNER JOIN DITE_Divisions d ON api.Description = d.[Names]
      INNER JOIN DITE_ArticulsToWB wb ON d.ID = wb.ID_Divisions
      WHERE wb.ArticulWB = ${articleID}`;
    
    if (result.recordset.length > 0) {
      res.json({ apiKey: result.recordset[0].ApiNew });
    } else {
      res.status(404).send('API ключ не найден');
    }
  } catch (error) {
    console.error('Ошибка при запросе к БД:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Сервер запускается по HTTPS
const privateKey = fs.readFileSync('C:/Users/Administrator/Certificates/privkey.pem', 'utf8');
const certificate = fs.readFileSync('C:/Users/Administrator/Certificates/cert.pem', 'utf8');
const ca = fs.readFileSync('C:/Users/Administrator/Certificates/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`Сервер работает по адресу https://di-vo.ru:${port}`);
});
