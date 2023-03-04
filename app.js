const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);

    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,

    districtName: dbObject.district_name,

    stateId: dbObject.state_id,

    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbObjectToResponseObject3 = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `

    SELECT

      *

    FROM

      state

    ORDER BY

      state_id;`;

  const stateArray = await db.all(getStatesQuery);

  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//adding post

app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const addDistrictQuery = `
    INSERT INTO
      district (district_name,state_id, cases,cured,active, deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
        ${deaths},
         
      );`;

  const updatedDistrict = await db.run(addDistrictQuery);

  response.send("District Successfully Added");
});

//getting states

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `

    SELECT

      *

    FROM

      state

    WHERE 

     state_id = ${stateId}`;

  const stateName = await db.get(getStateQuery);

  response.send(convertDbObjectToResponseObject(stateName));
});

///geting district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `

    SELECT

      *

    FROM

      district

    WHERE 

     district_id = ${districtId}`;

  const districtName = await db.get(getDistrictQuery);

  response.send(convertDbObjectToResponseObject2(districtName));
});

//delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `

    DELETE FROM

      district

    WHERE

      district_id = ${districtId};`;

  await db.run(deleteDistrictQuery);

  response.send("District Removed");
});

// Districts update

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `

    UPDATE

      district

    SET

      district_name = '${districtName}',

      state_id=${stateId},

      cases=${cases},

      cured = ${cured},

      active=${active},

      deaths=${deaths}



    WHERE

      district_id = ${districtId};`;

  await db.run(updateDistrictQuery);

  response.send("District Details Updated");
});

// getting specfic name based on district

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `

    SELECT

      state.state_name

    FROM

      state INNER JOIN district ON state.state_id = district.state_id

    WHERE 

     district_id = ${districtId}`;

  const stateName = await db.get(getDistrictQuery);

  response.send(convertDbObjectToResponseObject3(stateName));
});

// getting totals sums

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getDistrictQuery = `

    SELECT

      SUM(cases) as sum_cases,
      SUM(cured) as sum_cured,
      SUM(active) as sum_active,
      SUM(deaths) as sum_deaths


    FROM

      district

    WHERE 

     state_id = ${stateId}`;

  const votes = await db.get(getDistrictQuery);

  response.send({
    totalCases: votes["sum_cases"],
    totalCured: votes["sum_cured"],
    totalActive: votes["sum_active"],
    totalDeaths: votes["sum_deaths"],
  });
});

module.exports = app;
