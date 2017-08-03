import React, { Component } from 'react';
import { Grid, Navbar, Jumbotron, Button } from 'react-bootstrap';
import ReactTable from 'react-table';
import 'react-table/react-table.css'

import logo from './logo.svg';
import './App.css';

import * as jexlUtils from './jexl-utils';

import moment from 'moment';
import cached_recipes from './pref-experiments.json';

const FETCH_LIVE_RECIPES = process.env.NODE_ENV === "production"
  || process.env.REACT_APP_FETCH_LIVE_RECIPES;

function _fetchAllRecipes () {
  // until CORS at normandy is solved.
  const myHeaders = new Headers({
    "X-Requested-With": "X-Shield-Inflight-Dashboard",
  });
  var myInit = { method: 'GET',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default' };

  const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com"
  const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";
  const uri = `${CORS_ANYWHERE}/${API_ROOT}/recipe/`;
  console.log("loading!", uri)
  return fetch(uri, myInit).then((res)=>res.json())
}

function fetchAllRecipes () {
  if (FETCH_LIVE_RECIPES) {
    return _fetchAllRecipes()
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
          const url = `https://normandy.cdn.mozilla.net/api/v2/recipe/${recipeId}/history/`;
          return <a href={url} className='number'>{props.value}</a> // Custom cell components!
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

class App extends Component {
  render() {
    return (
      <div className="Main">
        <Navbar inverse>
          <Grid>
            <Navbar.Header>
              <Navbar.Brand>
                <a href="/">X-Shield Studies Inflight Dashboard</a>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
          </Grid>
        </Navbar>

        <InlflightTable />

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
