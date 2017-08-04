import React, { Component } from 'react';
import { Grid,
  Navbar,
  Nav,
  NavItem,
  Jumbotron,
  Button
} from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom'

import ReactTable from 'react-table';
import 'react-table/react-table.css'

import logo from './logo.svg';
import './App.css';

import * as normandy from './normandy-fetch-api';
import * as jexlUtils from './jexl-utils';

import { describeHistory } from './recipeHistory'
import moment from 'moment';
import cached_recipes from './pref-experiments.json';

const FETCH_LIVE_RECIPES = process.env.NODE_ENV === "production"
  || process.env.REACT_APP_FETCH_LIVE_RECIPES;


let BASENAME = '';
switch (process.env.NODE_ENV) {
  case "production":
    BASENAME = "/x-shield-inflight-dashboard";
    break;
  default:
}

function fetchAllRecipes () {
  if (FETCH_LIVE_RECIPES) {
    return normandy.fetchAllRecipes()
  } else {
    return Promise.resolve(cached_recipes);
  }
}

function processRecipes (recipes) {
  return recipes.map(r=>{
    const out = {
      enabled: r.enabled.toString(),
      approved: r.is_approved.toString(),
      id: r.id,
    };
    const rtype = r.action.name;
    if (rtype === 'preference-experiment') {
      try {
        out.pct = (jexlUtils.sampling(r.filter_expression)[0].args[0]*100).toFixed();
      } catch (err) {
        out.pct = 'unknown';
      }
      // find bug
      out.doclink = r.arguments.experimentDocumentUrl;

      try {
        out.channels = (jexlUtils.channels(r.filter_expression)[0]);
      } catch (err) {
        out.channels = 'unknown';
      }
      out.preference = r.arguments.preferenceName;
      out.owner = r.approval_request.creator.email;
      out.lastrev = moment(r.latest_revision.date_created).calendar();
      out.proposedEnd = "unknown";
      return out;
    } else {
      return false
    }
  }).filter(Boolean)
}

class InlflightTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recipes: null,
    };
  }
  componentDidMount() {
    console.log("mounting")
    //fetchAllRecipes()
    //  .then(recipes => {
    //    let processed = processRecipes(recipes);
    //    this.setState({ recipes: processed });
    //    console.log("set state", this.state.recipes.length)
    //  });
  }
  promiseRecipes () {
    let recipes = this.state.recipes;
    if (recipes) {
      return Promise.resolve(recipes)
    } else {
      return fetchAllRecipes()
       .then(recipes => {
          let processed = processRecipes(recipes);
          this.setState({ recipes: processed});
          return Promise.resolve(processed);
      })
    }
  }

  render() {
    /*var data = [
      {enabled: true},
      {enabled: false},
      {enabled: true},
      {enabled: true},
      {enabled: true},

    ]
    var data = [{
      name: 'Tanner Linsley',
      age: 26,
      friend: {
        name: 'Jason Maurer',
        age: 23,
      },
      extra: 1
    }];
    */

    /*
    const columns = [{
      Header: 'Name',
      accessor: 'name' // String-based value accessors!
    }, {
      Header: 'Age',
      accessor: 'age',
      Cell: props => <span className='number'>{props.value}</span> // Custom cell components!
      }, {
        id: 'friendName', // Required because our accessor is not a string
        Header: 'Friend Name',
        accessor: d => d.friend.name // Custom value accessors!
      }, {
        Header: props => <span>Friend Age</span>, // Custom header components!
        accessor: 'friend.age'
    }
    ];
    */

    const columns = [
      {
        "Header": "Id",
        "accessor": "id",
        "maxWidth": 40,
        "Cell": props => {
          let recipeId = props.value;
          console.log(props);
          const url = `https://normandy.cdn.mozilla.net/api/v2/recipe/${recipeId}/history/`;
          return <Link to={`/recipe/${recipeId}`}>{recipeId}</Link>;
          //return <a href={url} className='number'>{props.value}</a> // Custom cell components!
        }
      },
      {
        "Header": "Enabled",
        "accessor": "enabled",
        "maxWidth": 80
      },
      {
        "Header": "Approved",
        "accessor": "approved",
        "maxWidth": 80
      },
      {
        "Header": "Preference",
        "accessor": "preference",
        "minWidth": 200,
      },
      {
        "Header": "Bug",
        "accessor": "doclink",
        "Cell": props => {
            let doc, shortname;
            doc = shortname = props.value;
            if (doc.includes("bugzilla")) {
              shortname = `${/(\d+)$/.exec(doc)[0]}`;
            }
          return <a href={doc}>{shortname}</a> // Custom cell components!
        }
      },
      {
        "Header": "Channels",
        "accessor": "channels"
      },
      {
        "Header": "Sample %",
        "accessor": "pct",
        "maxWidth": 80
      },
      {
        "Header": "Last Rev",
        "accessor": "lastrev"
      },
      {
        "Header": "Proposed End",
        "accessor": "proposedEnd"
      },
      {
        "Header": "Owner",
        "accessor": "owner"
      }
    ]
    return (
      <ReactTable
        data={this.state.recipes || []}
        columns={columns}
        loading={this.state.loading}
        defaultPageSize={20}
        minRows={3}
        onFetchData={(state, instance) => {
          // show the loading overlay
          this.setState({loading: true});
          let recipes = this.promiseRecipes();
          recipes.then((recipeList)=>{
            console.log(recipeList.length)
            this.setState({recipes: recipeList || [], loading: false });
          })
        }}
      />
    )
  }
}

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

const Home = () => (
  <h3> this is the home page</h3>
);
const NoMatch = () => (
  <h3>You are not supposed to be here!</h3>
)

class RecipeHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recipeHistory: null,
      raw: null
    };
  }
  promiseRecipeHistory (recipeId) {

    if (this.state.recipeHistory) return Promise.resolve(this.state)
    else {
      return normandy.fetchRecipeHistory(recipeId).then(rlist=>{
        console.log("GOT HISTORY", recipeId, rlist);
        return {
          recipeHistory: describeHistory(rlist),
          raw: rlist
        }
      })
    }
  }
  render () {
    const match = this.props.match;
    const recipeId = match.params.recipeId;

    /*
     tpl = `
{{iter}}: ({{{reltime}}})    {{revId}} {{date_created}}
    {{#comment}}{{{comment}}}{{/comment}}
    {{#changes}}changes: {{{changes}}}{{/changes}}
    current: enabled:{{status.enabled}} approved:{{status.approved}}
    sample: {{{sampling}}}`;
    */
    const columns = [
      {
        "Header": "Rev",
        "accessor": "iter",
        maxWidth: 80
      },
      {
        "Header": "Time",
        "accessor": x=>moment(x.reltime).calendar(),
        "id": "ts",
        width: 100
      },
      {
        "Header": "id",
        "accessor": "revId",
        maxWidth: 80,
      },
      {
        "Header": "comment",
        "accessor": "comment",
        // handle comment / text fields
        Cell: row => (
          <div
            style={{
              whiteSpace: "normal",
              overflow: "visible"
            }}
          > {row.value}
          </div>
        ),
        "minWidth": 200
      },
      {
        "Header": "changes",
        "accessor": "changes",
        Cell: row => (<div
          style={{
            whiteSpace: "normal",
            overflow: "visible",
            hyphens: "none"
          }}
        > {row.value}
        </div>)

      },
      {
        "Header": "enabled",
        "id": "enabled",
        "accessor": x=>x.status.enabled.toString()
      },
      {
        "Header": "approved",
        "id": "approved",
        "accessor": x=>x.status.approved.toString()
      },
      {
        "Header": "sample",
        "id": "sample",
        "accessor": "sampling",
        "minWidth": 150,
      },
    ]

    let Description = (props) => {
      if (this.state.raw) {
        const rev0 = this.state.raw[0];
        return (
          <div>
            <h4><strong>Name</strong>:  {rev0.recipe.name}</h4>
            <h4><strong>Type</strong>:  {rev0.recipe.action.name}</h4>
          </div>
        )
      } else return (
       <div><p>Loading Summary data....</p></div>
      )
    }
    return (
      <div>
        <h3>history for recipe {recipeId}</h3>
        <Description />
        <ReactTable
          data={this.state.recipeHistory || []}
          columns={columns}
          loading={this.state.loading}
          defaultPageSize={20}
          minRows={3}
          onFetchData={(state, instance) => {
            // show the loading overlay
            this.setState({loading: true});
            let data = this.promiseRecipeHistory(recipeId);
            data.then(({recipeHistory, raw})=>{
              this.setState({recipeHistory, raw, loading: false });
            })
          }}
        />
        <pre>
          {JSON.stringify(this.state.recipeHistory, null, 2)}
        </pre>
      </div>

    )
  }
}

const Dashboard = () => (
  <InlflightTable />
)

class App extends Component {
  render() {
    return (
      <div className="Main">
        <Navbar inverse collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                <a href="/">X-Shield Studies Inflight Dashboard</a>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav pullRight>
                  <NavItem
                      eventKey={1}
                      href="https://github.com/gregglind/x-shield-inflight-dashboard/">
                      <img alt="Github Repository Link" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RERCMUIwOUY4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RERCMUIwOUU4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkU1MTc4QTJBOTlBMDExRTI5QTE1QkMxMDQ2QTg5MDREIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU1MTc4QTJCOTlBMDExRTI5QTE1QkMxMDQ2QTg5MDREIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+jUqS1wAAApVJREFUeNq0l89rE1EQx3e3gVJoSPzZeNEWPKgHoa0HBak0iHiy/4C3WvDmoZ56qJ7txVsPQu8qlqqHIhRKJZceesmhioQEfxTEtsoSpdJg1u/ABJ7Pmc1m8zLwgWTmzcw3L+/te+tHUeQltONgCkyCi2AEDHLsJ6iBMlgHL8FeoqokoA2j4CloRMmtwTmj7erHBXPgCWhG6a3JNXKdCiDl1cidVbXZkJoXQRi5t5BrxwoY71FzU8S4JuAIqFkJ2+BFSlEh525b/hr3+k/AklDkNsf6wTT4yv46KIMNpsy+iMdMc47HNWxbsgVcUn7FmLAzzoFAWDsBx+wVP6bUpp5ewI+DOeUx0Wd9D8F70BTGNjkWtqnhmT1JQAHcUgZd8Lo3rQb1LAT8eJVUfgGvHQigGp+V2Z0iAUUl8QH47kAA1XioxIo+bRN8OG8F/oBjwv+Z1nJgX5jpdzQDw0LCjsPmrcW7I/iHScCAEDj03FtD8A0EyuChHgg4KTlJQF3wZ7WELppnBX+dBFSVpJsOBWi1qiRgSwnOgoyD5hmuJdkWCVhTgnTvW3AgYIFrSbZGh0UW/Io5Vp+DQoK7o80pztWMemZbgxeNwCNwDbw1fIfgGZjhU6xPaJgBV8BdsMw5cbZoHsenwYFxkZzl83xTSKTiviCAfCsJLysH3POfC8m8NegyGAGfLP/VmGmfSChgXroR0RSWjEFv2J/nG84cuKFMf4sTCZqXuJd4KaXFVjEG3+tw4eXbNK/YC9oXXs3O8NY8y99L4BXY5cvLY/Bb2VZ58EOJVcB18DHJq9lRsKr8inyKGVjlmh29mtHs3AHfuhCwy1vXT/Nu2GKQt+UHsGdctyX6eQyNvc+5sfX9Dl7Pe2J/BRgAl2CpwmrsHR0AAAAASUVORK5CYII=" />
                  </NavItem>
              </Nav>
            </Navbar.Collapse>
        </Navbar>

        <Router basename={ BASENAME }>
          <Switch>
            <Route exact path="/" component={Dashboard}/>
            <Route path="/about" component={About}/>
            <Route path="/recipe/:recipeId" component={RecipeHistory}/>
            <Route component={NoMatch}/>
          </Switch>
        </Router>

        {/*<div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>*/}
        {/*<p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>*/}


        {/* example react-bootstrap stuff */}
        <div>
          {/*
          <Navbar inverse>
            <Grid>
              <Navbar.Header>
                <Navbar.Brand>
                  <a href="/">Shield Studies Inflight Dashboard</a>
                </Navbar.Brand>
                <Navbar.Toggle />
              </Navbar.Header>
            </Grid>
          </Navbar>
          <Jumbotron>
            <Grid>
              <h1>Welcome to React</h1>
              <p>
                <Button
                  bsStyle="success"
                  bsSize="large"
                  href="http://react-bootstrap.github.io/components.html"
                  target="_blank">
                  View React Bootstrap Docs
                </Button>
              </p>
            </Grid>
          </Jumbotron>
          */}
        </div>


        {/* comment */}
        {/*
        <div className="container">
          <h2>Basic Table</h2>
          <p>The .table class adds basic styling (light padding and only horizontal dividers) to a table:</p>
          <table className="table">
            <thead>
              <tr>
                <th>Firstname</th>
                <th>Lastname</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John</td>
                <td>Doe</td>
                <td>john@example.com</td>
              </tr>
              <tr>
                <td>Mary</td>
                <td>Moe</td>
                <td>mary@example.com</td>
              </tr>
              <tr>
                <td>July</td>
                <td>Dooley</td>
                <td>july@example.com</td>
              </tr>
            </tbody>
          </table>
        </div>
        */}

      {/* END OF APP */}
      </div>
    );
  }
}

export default App;
