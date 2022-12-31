import {Router} from "express";

/* GET home page. */
const router = Router();
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

export default router;
