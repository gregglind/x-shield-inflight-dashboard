const VERSION = require("./package.json").version;

const { getHistory } = require("./history");

var jsonfile = require('jsonfile');
const argv = require('minimist')(process.argv.slice(2));
const moment = require("moment");

const jexlUtils = require("./jexl-utils");
//console.dir(argv);

const clui = require('clui'),
    clc = require('cli-color'),
    Line = clui.Line,
    Spinner = clui.Spinner;

const meow = require('meow');
const cli = meow(`
    Usage
      $ cli.js <command>

    Commands
    - inflight
    - history <recipeNumber>
`,
{});

const normandy = require("./normandy-api");
function displayInflight (recipes) {

  function headers () {
    const L = new Line()
      .column('Enabled', 10, [clc.cyan])
      .column('Approved', 10, [clc.cyan])
      .column('Preference', 50, [clc.cyan])
      .padding(2)
      .column('Bug', 10 , [clc.cyan])
      .padding(2)
      .column('Channels', 10, [clc.cyan])
      .column('Sample %', 8, [clc.cyan])
      .padding(2)
      .column('Last Rev', 15, [clc.cyan])
      .column('Proposed End', 15, [clc.cyan])
      .column('Owner', 20, [clc.cyan])

      .fill()
      .output()
  }
  const lines = {
    pref: function (d) {
      debugger;
      const L = new Line()
      .column(" *"[Number(d.enabled)], 10 )
      .column(" *"[Number(d.enabled)], 10 )
      .column(d.arguments.preferenceName, 50 )
      .padding(2)
      .column(d.bug, 10)
      .padding(2)
      .column('??', 10 )
      .column(d.pct.padStart(8), 8)
      .padding(2)
      .column(moment(d.latest_revision.date_created).calendar(), 15)
      .column('not set', 15, [clc.red])
      .column(d.approval_request.creator.email || clc.red("unknown"), 20)
      .fill()
      .output()
    }
  };
  headers();

  recipes.forEach(r=>{
    const rtype = r.action.name;
    if (rtype == 'preference-experiment') {
      jexlUtils;
      debugger;
      try {
        r.pct = (jexlUtils.sampling(r.filter_expression)[0].args[0]*100).toFixed();
      } catch (err) {
        r.pct = clc.red('unknown')
      }
      // find bug
      let bug = r.arguments.experimentDocumentUrl;
      if (bug.includes("bugzilla")) {
        r.bug = `${/(\d+)$/.exec(bug)[0]}`;
      }
      else r.bug = bug;

      debugger;
      lines.pref(r);
    }
  })
}

function main () {
  const S = new Spinner("getting recipes...");
  S.start();

  // for now!
  let recipes;
  let rf = argv._[0];
  if (rf) recipes = Promise.resolve(jsonfile.readFileSync(rf));
  else recipes = normandy.promiseRecipeList();
  recipes.then(recipes=>{
    S.stop();
    displayInflight(recipes)
    //if (!program.args.length) program.help();
  })
}

if (require.main === module) {
  main();
}
