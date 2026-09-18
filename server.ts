import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { getDb, persistDb } from './server/db.ts';
import {
  solveMathFormula,
  processCurriculumImage,
  generateMiniExam,
  gradeExamAndGiveFeedback,
  chatMathTutor,
} from './server/gemini.ts';
import { generateSwiftZip, generateApkProjectZip } from './server/exportCode.ts';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON (allow up to 25MB for high-res photo OCR uploads)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize SQLite database
  const db = await getDb();
  console.log('SQLite SQL Database initialized.');

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MathFormula Studio Server', time: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION & SQL ACCOUNTS
  // ==========================================
  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, password, school, grade, textbook } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const existing = db.exec("SELECT * FROM users WHERE username = '" + username.replace(/'/g, "''") + "'");
      if (existing.length > 0 && existing[0].values.length > 0) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const stmt = db.prepare(
        'INSERT INTO users (id, username, password_hash, school, grade, textbook) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.run([id, username, hash, school || '', grade || 'Grade 10', textbook || 'Standard']);
      stmt.free();
      persistDb();

      res.json({
        success: true,
        user: { id, username, school: school || '', grade: grade || 'Grade 10', textbook: textbook || 'Standard' },
      });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const stmt = db.prepare('SELECT id, username, password_hash, school, grade, textbook FROM users WHERE username = ?');
      stmt.bind([username]);

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        const valid = bcrypt.compareSync(password, row.password_hash as string);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid password' });
        }
        res.json({
          success: true,
          user: {
            id: row.id,
            username: row.username,
            school: row.school,
            grade: row.grade,
            textbook: row.textbook,
          },
        });
      } else {
        stmt.free();
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.post('/api/auth/update-profile', (req, res) => {
    try {
      const { userId, school, grade, textbook } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const stmt = db.prepare('UPDATE users SET school = ?, grade = ?, textbook = ? WHERE id = ?');
      stmt.run([school || '', grade || 'Grade 10', textbook || 'Standard', userId]);
      stmt.free();
      persistDb();

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // FORMULA SOLVER & CALCULATION HISTORY
  // ==========================================
  app.post('/api/solve', async (req, res) => {
    try {
      const { formulaName, expression, variables, useHighThinking, userId } = req.body;
      if (!expression) {
        return res.status(400).json({ error: 'Expression is required' });
      }

      const solution = await solveMathFormula(
        formulaName || 'Math Formula',
        expression,
        variables || {},
        Boolean(useHighThinking)
      );

      // Save to SQL database
      const id = 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const stmt = db.prepare(
        'INSERT INTO calculations (id, user_id, title, formula, expression, variables_json, result, steps_json, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run([
        id,
        userId || 'guest',
        solution.formulaName || formulaName || 'Formula Calculation',
        solution.latex || '',
        expression,
        JSON.stringify(variables || {}),
        solution.result,
        JSON.stringify(solution.steps || []),
        solution.category || 'General',
      ]);
      stmt.free();
      persistDb();

      res.json({ success: true, id, solution });
    } catch (err: any) {
      console.error('Solve error:', err);
      res.status(500).json({ error: err.message || 'Calculation failed' });
    }
  });

  app.get('/api/history', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';
      const stmt = db.prepare('SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
      stmt.bind([userId]);
      const results: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          id: row.id,
          title: row.title,
          formula: row.formula,
          expression: row.expression,
          variables: JSON.parse((row.variables_json as string) || '{}'),
          result: row.result,
          steps: JSON.parse((row.steps_json as string) || '[]'),
          category: row.category,
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ history: results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/calculations', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';
      const stmt = db.prepare('SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
      stmt.bind([userId]);
      const results: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          id: row.id,
          title: row.title,
          formula: row.formula,
          expression: row.expression,
          variables: JSON.parse((row.variables_json as string) || '{}'),
          result: row.result,
          steps: JSON.parse((row.steps_json as string) || '[]'),
          category: row.category,
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ success: true, calculations: results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/calculations', (req, res) => {
    try {
      const { id, userId, title, formula, expression, variables, result, steps, category } = req.body;
      const calcId = id || 'calc_' + Date.now();
      const stmt = db.prepare(
        'INSERT INTO calculations (id, user_id, title, formula, expression, variables_json, result, steps_json, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run([
        calcId,
        userId || 'guest',
        title || 'Calculation',
        formula || '',
        expression || '',
        JSON.stringify(variables || {}),
        result || '',
        JSON.stringify(steps || []),
        category || 'General',
      ]);
      stmt.free();
      persistDb();
      res.json({ success: true, id: calcId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/calculations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM calculations WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/history/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM calculations WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/history', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';
      const stmt = db.prepare('DELETE FROM calculations WHERE user_id = ?');
      stmt.run([userId]);
      stmt.free();
      persistDb();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // OCR CURRICULUM & STUDY PLAN
  // ==========================================
  app.post('/api/ocr-curriculum', async (req, res) => {
    try {
      const { imageBase64, mimeType, schoolInfo, userId } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data required' });
      }

      const planData = await processCurriculumImage(imageBase64, mimeType || 'image/jpeg', schoolInfo);

      const id = 'curr_' + Date.now();
      const stmt = db.prepare(
        'INSERT INTO curriculums (id, user_id, title, raw_ocr_text, plan_json, score_out_of_10, grade, chapter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run([
        id,
        userId || 'guest',
        planData.curriculumTitle || 'Scanned Curriculum',
        planData.ocrText || '',
        JSON.stringify(planData),
        planData.masteryScoreEstimate || 7,
        planData.gradeLevel || schoolInfo?.grade || 'Grade 10',
        planData.subject || 'Math',
      ]);
      stmt.free();
      persistDb();

      res.json({ success: true, id, plan: planData });
    } catch (err: any) {
      console.error('OCR Curriculum error:', err);
      res.status(500).json({ error: err.message || 'Curriculum analysis failed' });
    }
  });

  app.get('/api/curriculums', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';
      const stmt = db.prepare('SELECT * FROM curriculums WHERE user_id = ? ORDER BY created_at DESC');
      stmt.bind([userId]);
      const list: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        list.push({
          id: row.id,
          title: row.title,
          ocrText: row.raw_ocr_text,
          plan: JSON.parse((row.plan_json as string) || '{}'),
          scoreOutOf10: row.score_out_of_10,
          grade: row.grade,
          chapter: row.chapter,
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ curriculums: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // MINI EXAMS & EXAM PREPARATION
  // ==========================================
  app.post('/api/exam/generate', async (req, res) => {
    try {
      const { grade, chapter, book, school, questionCount } = req.body;
      const exam = await generateMiniExam({
        grade: grade || 'Grade 10',
        chapter: chapter || 'Quadratic Equations & Polynomials',
        book: book || 'Standard Textbook',
        school: school || 'School Curriculum',
        questionCount: questionCount || 5,
      });
      res.json({ success: true, exam });
    } catch (err: any) {
      console.error('Generate exam error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate mini exam' });
    }
  });

  app.post('/api/exam/submit', async (req, res) => {
    try {
      const { examTitle, grade, chapter, userResponses, userId } = req.body;
      if (!userResponses || !Array.isArray(userResponses)) {
        return res.status(400).json({ error: 'Responses required' });
      }

      const evaluation = await gradeExamAndGiveFeedback(
        examTitle || 'Mini-Exam',
        grade || 'Grade 10',
        chapter || 'Math',
        userResponses
      );

      const id = 'exam_' + Date.now();
      const stmt = db.prepare(
        'INSERT INTO exams (id, user_id, title, grade, chapter, questions_json, answers_json, score, total_questions, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.run([
        id,
        userId || 'guest',
        examTitle || 'Mini-Exam',
        grade || 'Grade 10',
        chapter || 'Math',
        JSON.stringify(userResponses),
        JSON.stringify(userResponses.map((r: any) => r.selectedOption)),
        evaluation.scorePercent,
        userResponses.length,
        JSON.stringify(evaluation),
      ]);
      stmt.free();
      persistDb();

      res.json({ success: true, id, evaluation });
    } catch (err: any) {
      console.error('Submit exam error:', err);
      res.status(500).json({ error: err.message || 'Failed to submit exam' });
    }
  });

  app.get('/api/exams', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';
      const stmt = db.prepare('SELECT * FROM exams WHERE user_id = ? ORDER BY created_at DESC');
      stmt.bind([userId]);
      const list: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        list.push({
          id: row.id,
          title: row.title,
          grade: row.grade,
          chapter: row.chapter,
          score: row.score,
          totalQuestions: row.total_questions,
          feedback: JSON.parse((row.feedback as string) || '{}'),
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ exams: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // AI MATH TUTOR CHATBOT
  // ==========================================
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, message, history, context } = req.body;
      let msgs = messages;
      if (!msgs && message) {
        msgs = [...(history || []), { role: 'user', content: message }];
      }
      if (!msgs || !Array.isArray(msgs)) {
        return res.status(400).json({ error: 'Messages array required' });
      }

      const reply = await chatMathTutor(msgs, context);
      res.json({ success: true, reply });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message || 'Chatbot request failed' });
    }
  });

  // ==========================================
  // EXPORT CODES (SWIFT & APK ZIPS)
  // ==========================================
  app.get('/api/export/swift-zip', async (req, res) => {
    try {
      const zipBuffer = await generateSwiftZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="MathFormulaStudio-iOS-Swift.zip"');
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/export/apk-zip', async (req, res) => {
    try {
      const zipBuffer = await generateApkProjectZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="MathFormulaStudio-Android-APK-Source.zip"');
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // CLOUD SYNC & RAW SQL INSPECTOR
  // ==========================================
  app.post('/api/sync', (req, res) => {
    try {
      const { userId, localHistory } = req.body;
      if (Array.isArray(localHistory)) {
        for (const item of localHistory) {
          try {
            const check = db.exec("SELECT id FROM calculations WHERE id = '" + item.id + "'");
            if (check.length === 0 || check[0].values.length === 0) {
              const stmt = db.prepare(
                'INSERT INTO calculations (id, user_id, title, formula, expression, variables_json, result, steps_json, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
              );
              stmt.run([
                item.id,
                userId || 'guest',
                item.title || 'Calculation',
                item.formula || '',
                item.expression,
                JSON.stringify(item.variables || {}),
                item.result,
                JSON.stringify(item.steps || []),
                item.category || 'General',
              ]);
              stmt.free();
            }
          } catch (e) {
            // ignore duplicate sync
          }
        }
      }
      persistDb();

      const stmt = db.prepare('SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC');
      stmt.bind([userId || 'guest']);
      const cloudHistory: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        cloudHistory.push({
          id: row.id,
          title: row.title,
          formula: row.formula,
          expression: row.expression,
          variables: JSON.parse((row.variables_json as string) || '{}'),
          result: row.result,
          steps: JSON.parse((row.steps_json as string) || '[]'),
          category: row.category,
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ success: true, syncedCount: cloudHistory.length, cloudHistory });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/calculations/sync', (req, res) => {
    try {
      const { userId, records } = req.body;
      if (Array.isArray(records)) {
        for (const item of records) {
          try {
            const check = db.exec("SELECT id FROM calculations WHERE id = '" + item.id + "'");
            if (check.length === 0 || check[0].values.length === 0) {
              const stmt = db.prepare(
                'INSERT INTO calculations (id, user_id, title, formula, expression, variables_json, result, steps_json, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
              );
              stmt.run([
                item.id,
                userId || 'guest',
                item.title || 'Calculation',
                item.formula || '',
                item.expression,
                JSON.stringify(item.variables || {}),
                item.result,
                JSON.stringify(item.steps || []),
                item.category || 'General',
              ]);
              stmt.free();
            }
          } catch (e) {}
        }
      }
      persistDb();

      const stmt = db.prepare('SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC');
      stmt.bind([userId || 'guest']);
      const cloudRecords: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        cloudRecords.push({
          id: row.id,
          title: row.title,
          formula: row.formula,
          expression: row.expression,
          variables: JSON.parse((row.variables_json as string) || '{}'),
          result: row.result,
          steps: JSON.parse((row.steps_json as string) || '[]'),
          category: row.category,
          createdAt: row.created_at,
        });
      }
      stmt.free();
      res.json({ success: true, records: cloudRecords });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sql/query', (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql) return res.status(400).json({ error: 'SQL statement required' });
      const queryResult = db.exec(sql);
      res.json({ success: true, results: queryResult });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Parent Report Analytics Data
  app.get('/api/report/parent-data', (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'guest';

      let userProfile = { username: 'Student', school: '', grade: 'Grade 10', textbook: 'Standard' };
      const uStmt = db.prepare('SELECT username, school, grade, textbook FROM users WHERE id = ?');
      uStmt.bind([userId]);
      if (uStmt.step()) {
        userProfile = uStmt.getAsObject() as any;
      }
      uStmt.free();

      const cRes = db.exec(
        "SELECT category, COUNT(*) as count FROM calculations WHERE user_id = '" +
          userId.replace(/'/g, "''") +
          "' GROUP BY category"
      );
      const categoryBreakdown: any[] = [];
      if (cRes.length > 0) {
        cRes[0].values.forEach((v) => {
          categoryBreakdown.push({ category: v[0], count: v[1] });
        });
      }

      const eStmt = db.prepare(
        'SELECT title, grade, chapter, score, total_questions, created_at FROM exams WHERE user_id = ? ORDER BY created_at DESC'
      );
      eStmt.bind([userId]);
      const examsList: any[] = [];
      let totalScore = 0;
      while (eStmt.step()) {
        const row = eStmt.getAsObject();
        examsList.push(row);
        totalScore += (row.score as number) || 0;
      }
      eStmt.free();

      const avgExamScore = examsList.length > 0 ? Math.round(totalScore / examsList.length) : 85;

      res.json({
        student: userProfile,
        totalCalculations: categoryBreakdown.reduce((a, b) => a + Number(b.count), 0),
        categoryBreakdown,
        examsTaken: examsList.length,
        averageExamScore: avgExamScore,
        exams: examsList,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
