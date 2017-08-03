const request = require("request");
const moustache = require("moustache");
const moment = require("moment");
const equal = require('deep-equal');

// mozjexl
//var Evaluator = require('mozjexl/lib/evaluator/Evaluator'),
var  Lexer = require('mozjexl/lib/Lexer'),
  Parser = require('mozjexl/lib/parser/Parser'),
  defaultGrammar = require('mozjexl/lib/grammar').elements;

function visitAST(jexlParseTree, cb) {
  const out = [];
  cb = cb.bind(null, out);
  const tree = jexlParseTree;
  function visit (tree) {
    if (!tree) {
      return
    }
    cb(tree);
    visit(tree.left, cb);
    visit(tree.right, cb);
  }
  visit(tree, cb);
  return out;
}

// mostly if you want to allow other grammars
function parseJexl(expression, grammar=defaultGrammar) {
  const P = new Parser(grammar);
  P.addTokens(new Lexer(grammar).tokenize(expression))
  return P;
}



// specific TO OUR jexl
function _samplingVisitor (out, tree) {
  //console.log(tree);
  if (tree.type != "Transform") return;
  const samplers = ["bucketSample", "stableSample"];
  if (samplers.includes(tree.name)) {
    out.push({
      which: tree.name,
      args: tree.args.map(x=>x.value),
      subject: ["(args before pipe, TBD)"]
    });
    //console.log(out);
  }
}

function sampling (aFilterExpression) {
  const P = new Parser(defaultGrammar);
  P.addTokens(new Lexer(defaultGrammar).tokenize(aFilterExpression))
  const ans = visitAST(P._tree, _samplingVisitor);
  //console.log(ans);
  //debugger;
  return ans;
}


module.exports = {
  visitAST,
  Parser,
  parseJexl,
  sampling
}
