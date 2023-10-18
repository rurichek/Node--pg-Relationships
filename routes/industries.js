/** Routes for industries. */

const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({ inudstries: results.rows })
    } catch (e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        
        const results = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        return res.status(201).json({ industry: results.rows[0] })
      } catch (e) {
        return next(e)
      }
})


router.post('/associate', async (req, res, next) => {
    try {
        const { company_code, industry_code } = req.body;

        // Check if both company and industry exist before associating

        const companyCheck = await db.query('SELECT code FROM companies WHERE code = $1', [company_code]);
        if (companyCheck.rows.length === 0) {
            throw new ExpressError(`Company with code ${company_code} not found`, 404);
        }

        const industryCheck = await db.query('SELECT code FROM industries WHERE code = $1', [industry_code]);
        if (industryCheck.rows.length === 0) {
            throw new ExpressError(`Industry with code ${industry_code} not found`, 404);
        }
        
        const results = await db.query('INSERT INTO company_industry (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code', [company_code, industry_code]);
        return res.status(201).json({ association: results.rows[0] })
        
      } catch (e) {
        return next(e)
      }
})






module.exports = router