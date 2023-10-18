/** Routes for companies. */

const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows })
    } catch (e) {
        return next(e);
    }
})

router.get("/:code", async function (req, res, next) {
  try {
    let code = req.params.code;

    const compResult = await db.query(
          `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
        [code]
    );

    const invResult = await db.query(
          `SELECT id
           FROM invoices
           WHERE comp_code = $1`,
        [code]
    );

    const indResult = await db.query(
      `SELECT i.industry
       FROM industries AS i
       LEFT JOIN company_industry AS ci ON i.code = ci.industry_code
       WHERE ci.company_code = $1`, 
      [code]
  );
  

    if (compResult.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404)
    }

    const company = compResult.rows[0];
    const invoices = invResult.rows;
    const industries = indResult.rows;
    console.log('industries'); // Check if this outputs any industries.


    company.invoices = invoices.map(inv => inv.id);
    company.industries = industries.map(ind => ind.industry);

    return res.json({"company": company});
  }

  catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const code = slugify(name, {lower: true});
      
      const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
      return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

router.put('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description } = req.body;
      console.log('Executing SQL query:', 'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code]);
      const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't update company with code of ${code}`, 404)
      }
      return res.send({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

//   router.delete('/:code', async (req, res, next) => {
//     try {
//       const results = await db.query('DELETE FROM companies WHERE id = $1', [req.params.code])
//       return res.send({ msg: "DELETED!" })
//     } catch (e) {
//       return next(e)
//     }
//   })

router.delete('/:code', async (req, res, next) => {
    try {
      const codeToDelete = req.params.code;
      const results = await db.query('DELETE FROM companies WHERE code = $1', [codeToDelete]);
      console.log(`Deleted ${results.rowCount} record(s)`);
      
      if (results.rowCount === 1) {
        return res.send({ msg: "DELETED!" });
      } else {
        return res.status(404).send({ error: "Record not found" });
      }
    } catch (e) {
      console.error("Error deleting record:", e);
      return next(e);
    }
  });
  




module.exports = router