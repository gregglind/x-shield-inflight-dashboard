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
  if (tree.type !== "Transform") return;
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

function followId (tree) {
  const parts = [tree.value];
  while(tree.from) {
    tree = tree.from;
    parts.push(tree.value);
  }
  return parts.reverse().join(".");
}

function _channelsVisitor (out, tree) {
  /* this only does the SIMPLEST THING, exact equality */

  //console.log(tree);
  if (tree.type !== "BinaryExpression") return;
  if (tree.operator === "==") {
    debugger;
    // in a == binaryExpression.
    // check if LEFT is 'normandy.channel'
    let Id = followId(tree.left);
    if (Id === "normandy.channel") {
      out.push(tree.right.value);
    }
  }
}

function sampling (aFilterExpression) {
  const P = parseJexl(aFilterExpression);
  const ans = visitAST(P._tree, _samplingVisitor);
  //console.log(ans);
  //debugger;
  return ans;
}

function channels (aFilterExpression) {
  const P = parseJexl(aFilterExpression);
  const ans = visitAST(P._tree, _channelsVisitor);
  //console.log(ans);
  //debugger;
  return ans;
}

module.exports = {
  visitAST,
  Parser,
  parseJexl,
  sampling,
  channels
}

if (require.main === module) {
  const expression = process.argv[2];
  const P = parseJexl(expression);
  console.log(P._tree);

  let command = process.argv[3];
  if (command) console.log(module.exports[command](expression));
  debugger;
}
