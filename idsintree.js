
expression = process.argv[2] || 'telemetry.main.prefs.somePref == true && normandy.clientId=="abced" && channel=="nightly"';
console.log(`

  EXPRESSION TO PARSE

  ${expression}

`)

var Evaluator = require('./evaluator/Evaluator'),
  Lexer = require('./Lexer'),
  Parser = require('./parser/Parser'),
  defaultGrammar = require('./grammar').elements;

P = new Parser(defaultGrammar);
P.addTokens(new Lexer(defaultGrammar).tokenize(expression))

function findIdsInTree (jexlParseTree) {
  const out = [];
  const tree = jexlParseTree;
  function followId (tree) {
    const parts = [tree.value];
    while(tree.from) {
      tree = tree.from;
      parts.push(tree.value);
    }
    return parts.reverse().join(".");
  }
  function recurse (tree) {
    if (!tree) {
      return
    }
    console.log(tree);
    if (tree.type === "Identifier") {
      debugger;
      let short = tree.value;
      let long = followId(tree);
      out.push({short: short, long: long});
    }
    recurse(tree.left);
    recurse(tree.right);
  };
  recurse(tree);
  return out;
}
out = findIdsInTree(P._tree);
debugger;
console.log(`\nidentifiers: ${JSON.stringify(out)}`)
