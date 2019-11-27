
import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';  
import { useParams } from "react-router-dom";

import bluebird from 'bluebird';
import moment from 'moment';
import { DateRangePicker } from 'react-dates';
import { Formik, Field } from 'formik';
import { toast } from 'react-toastify';
import { isFinite, merge } from 'lodash';

import * as tzOffset from "../tzoffset";
import { auth, validateResponse } from '../appState';
import * as isUserMetric from "../isUserMetric";
import tomiles from '../tomiles';
import tohms from './tohms';
import * as formatDate from '../formatDate';
import * as todir from '../../common/todir'; 
import { full } from "../../common/addressdisplay";

const reports = [
  'idle',
  'daily',
  'mileage',
  'odometer',
  'speed',
  'ignition',
  'start',
  'summary',
  'obd',
  'jes',
]


function renderLocation(item) {
  let res = "";
  if (street(item) !== "") {
    res = res + street(item);
  }
  if (city(item) !== "") {
    res = res + ", " + city(item);
  }
  if (state(item) !== "") {
    res = res + ", " + state(item);
  }
  return res;
}

//create your forceUpdate hook
function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => ++value); // update the state to force render
}

let count = 0;

function Idle({results, vehicles, totals = []}) {
  return (
    <div>
      <div>
        <table className="table table-condensed table-bordered table-striped dataTable">
          <thead>
            <tr>
              <td>Vehicle</td>
              <td>Idling Total</td>
            </tr>
          </thead>
          <tbody>
            { Object.keys(vehicles).map(vid => { <tr>
              <td>{ vehicles[vid].name }</td>
              <td>{ totals[vid] && tohms(totals[vid] / 1000) }</td>
            </tr>
            })}
          </tbody>
        </table>
      </div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Location</td>
            <td>City</td>
            <td>State</td>
            <td>Idle Start</td>
            <td>Idle End</td>
            <td>Duration</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid => {
              return <Fragment key={`${vid}${count++}`}>
                <tr key={`header${vid}${count++}`}>
                  <td colSpan="7" className="group">
                    { vehicles[vid].name }
                  </td>
                </tr>
                {
                  results[vid] && Object.keys(results[vid]).map(key => {
                    return <tr key={`result${vid}${key}${count++}`}>
                      <td>{key}</td>
                      <td>{tomiles(results[vid][key])}</td>
                    </tr>
                  })
                }
              </Fragment>
            })
          }
        </tbody>
      </table>
    </div>
  )
}

function Daily({results, vehicles}) {
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Date</td>
            <td>First Ign On</td>
            <td>Last Ign Off</td>
            <td>Duration</td>
            <td>Begin Odometer</td>
            <td>End Odometer</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
          </tr>
        </thead>
        <tbody>
          { Object.keys(vehicles).map(vid => <tr>
            <td colspan="7" className="group">{ vehicles[vid].name }</td>
            { results[vid].map( result => <tr>
              <td>{ formatDate(result.d) }</td>
              <td>{ result.firstIgnOn && formatDate(result.firstIgnOn) }</td>
              <td>{ result.lastIgnOff && formatDate(result.lastIgnOff) }</td>
              <td>{ tohms(result.duration) }</td>
              <td>{ tomiles(result.beginOdometer) }</td>
              <td>{ tomiles(result.endOdometer) }</td>
              <td>{ tomiles(result.distance) }</td>
            </tr>)}
          </tr> )}
        </tbody>
      </table>
    </div>

  );
}

function Mileage({results, vehicles}) {
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>State</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid => {
              return <Fragment key={`${vid}${count++}`}>
                <tr key={`header${vid}${count++}`}>
                  <td colSpan="7" className="group">
                    { vehicles[vid].name }
                  </td>
                </tr>
                {
                  results[vid] && Object.keys(results[vid]).map(key => {
                    return <tr key={`result${vid}${key}${count++}`}>
                      <td>{key}</td>
                      <td>{tomiles(results[vid][key])}</td>
                    </tr>
                  })
                }
              </Fragment>
            })
          }
        </tbody>
      </table>
    </div>
  )
}

function Odometer({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>State</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Start Odometer</td>
            <td>End Odometer</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid => {
              return <Fragment key={`${vid}${key++}`}>
                <tr key={`header${vid}${key++}`}>
                  <td colSpan="7" className="group">
                    { vehicles[vid].name }
                  </td>
                </tr>
                {
                  results[vid].map(item => {
                    return <tr key={`${key++}`}>
                      <td>{item.state}</td>
                      <td>{tomiles(item.odometerEnd - item.odometerStart)}</td>
                      <td>{tomiles(item.odometerStart)}</td>
                      <td>{tomiles(item.odometerEnd)}</td>
                    </tr>
                  })
                }
              </Fragment>
            })
          }
        </tbody>
      </table>
    </div>
  )
}

function Speed({results, vehicles, totals = {}}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Vehicle</td>
            <td>Highest { isUserMetric() ? "km/h" : "mph" }</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid => {
              if (isFinite(tomiles(totals[vid]))) {
                return (
                  <tr>
                    <td>{ vehicles[vid].name }</td>
                    <td>{ tomiles(totals[vid]) }</td>
                  </tr>
                );
              }
            })
          }
        </tbody>
      </table>
      <br />
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Location</td>
            <td>Date</td>
            <td>Heading</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid =>
            <tr>
              <td colspan="7" className="group">{ vehicles[vid] && vehicles[vid].name }</td>
              {
                results[vid].map(item =>
                  <tr>
                    <td>{ renderLocation(item) }</td>
                    <td>{ formatDate(item.d) }</td>
                    <td>{ todir(item) }</td>
                    <td>{ tomiles(item.s) }</td>
                </tr>
                )
              }
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}

function Ignition({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Ign On</td>
            <td>Ign Off</td>
            <td>Ignition On Time</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Parked @</td>
            <td>Parked Until</td>
            <td>Parked Time</td>
            <td>Idle Time</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid =>
            <tr key={ key++ }>
              <td colspan="8" className="group">{ vehicles[vid] && vehicles[vid].name }</td>
              {
                results[vid].map(item =>
                  <tr key={ key++ }>
                    <td>{ item.startTime && formatDate(item.startTime) }</td>
                    <td>{ formatDate(item.d) }</td>
                    <td>{ item.transitTime && tohms(item.transitTime)  }</td>
                    <td>{ tomiles(item.startStopMileage) }</td>
                    <td>{ full(item) }</td>
                    <td>{ item.parkedEnd && formatDate(item.parkedEnd) }</td>
                    <td>{ item.parkedDuration && tohms(item.parkedDuration) }</td>
                    <td>{ item.idleDuration && tohms(item.idleDuration) }</td>
                </tr>
                )
              }
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}

function Start({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Started Moving</td>
            <td>Stopped Moving</td>
            <td>Transit Time</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Parked @</td>
            <td>Parked Until</td>
            <td>Parked Time</td>
            <td>Idle Time</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid =>
            <tr key={ key++ }>
              <td colspan="8" className="group">{ vehicles[vid] && vehicles[vid].name }</td>
              {
                results[vid].map(item =>
                  <tr key={ key++ }>
                    <td>{ item.startTime && formatDate(item.startTime) }</td>
                    <td>{ formatDate(item.d) }</td>
                    <td>{ item.transitTime && tohms(item.transitTime)  }</td>
                    <td>{ tomiles(item.startStopMileage) }</td>
                    <td>{ full(item) }</td>
                    <td>{ item.parkedEnd && formatDate(item.parkedEnd) }</td>
                    <td>{ item.parkedDuration && tohms(item.parkedDuration) }</td>
                    <td>{ item.idleDuration && tohms(item.idleDuration) }</td>
                </tr>
                )
              }
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}

function Summary({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Vehicle</td>
            <td>Transit Time</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Parked Time</td>
            <td>Parked</td>
            <td>Avg Park</td>
            <td>Total Idling</td>
            <td>Idle</td>
            <td>Avg Idle Time</td>
            <td>Begin Odometer</td>
            <td>End Odometer</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid => <tr key={ key++ }>
              <td>{ results[vid].name }</td>
              <td>{ tohms(results[vid].totalTarnsit) }</td>
              <td>{ tomiles(results[vid].distance) }</td>
              <td>{ tohms(results[vid].totalPark) }</td>
              <td>{ tohms(results[vid].avgPark) }</td>
              <td>{ tohms(results[vid].totalIdle) }</td>
              <td>{ results[vid].idles }</td>
              <td>{ results[vid].avgIdle }</td>
              <td>{ tomiles(results[vid].beginOdometer) }</td>
              <td>{ tomiles(results[vid].endOdometer) }</td>
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}

function Obd({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Ign On</td>
            <td>Ign Off</td>
            <td>Ignition On Time</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Parked @</td>
            <td>Parked Until</td>
            <td>Parked Time</td>
            <td>Idle Time</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid =>
            <tr key={ key++ }>
              <td colspan="8" className="group">{ vehicles[vid] && vehicles[vid].name }</td>
              {
                results[vid].map(item =>
                  <tr key={ key++ }>
                    <td>{ item.startTime && formatDate(item.startTime) }</td>
                    <td>{ formatDate(item.d) }</td>
                    <td>{ item.transitTime && tohms(item.transitTime)  }</td>
                    <td>{ tomiles(item.startStopMileage) }</td>
                    <td>{ full(item) }</td>
                    <td>{ item.parkedEnd && formatDate(item.parkedEnd) }</td>
                    <td>{ item.parkedDuration && tohms(item.parkedDuration) }</td>
                    <td>{ item.idleDuration && tohms(item.idleDuration) }</td>
                </tr>
                )
              }
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}

function Jes({results, vehicles}) {
  let key = 0;
  return (
    <div>
      <table className="table-condensed table-bordered table-striped dataTable">
        <thead>
          <tr>
            <td>Ign On</td>
            <td>Ign Off</td>
            <td>Ignition On Time</td>
            <td>{ isUserMetric() ? 'Kilometers' : 'Miles' }</td>
            <td>Parked @</td>
            <td>Parked Until</td>
            <td>Parked Time</td>
            <td>Idle Time</td>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(vehicles).map(vid =>
            <tr key={ key++ }>
              <td colspan="8" className="group">{ vehicles[vid] && vehicles[vid].name }</td>
              {
                results[vid].map(item =>
                  <tr key={ key++ }>
                    <td>{ item.startTime && formatDate(item.startTime) }</td>
                    <td>{ formatDate(item.d) }</td>
                    <td>{ item.transitTime && tohms(item.transitTime)  }</td>
                    <td>{ tomiles(item.startStopMileage) }</td>
                    <td>{ full(item) }</td>
                    <td>{ item.parkedEnd && formatDate(item.parkedEnd) }</td>
                    <td>{ item.parkedDuration && tohms(item.parkedDuration) }</td>
                    <td>{ item.idleDuration && tohms(item.idleDuration) }</td>
                </tr>
                )
              }
            </tr>)
          }
        </tbody>
      </table>
    </div>
  )
}


function Reports({ impliedSelectedVehiclesByID, orgsByID, vehiclesByID }) {
  const { orgId } = useParams();
  const [focusedInput, setFocusedInput] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [reportType, setReportType] = useState('idle');
  const [results, setResults] = useState({});
  const [resultVehicles, setResultVehicles] = useState({});
  const [startDate, setStartDate] = useState(moment().subtract(1, 'day'));
  const [endDate, setEndDate] = useState(moment());
  const forceUpdate = useForceUpdate();

  const execute = () => {
    setExecuting(true);
    const ids = Object.keys(impliedSelectedVehiclesByID);

    setResultVehicles({});
    setResults({});

    let runningResults = {};
    let runningVehicles = {};

    bluebird.map(ids, id => {
        setExecuting(id);
        return fetch(`/api/organizations/${orgId}/reports/${encodeURIComponent(reportType)}?vehicles=${encodeURIComponent(JSON.stringify([id]))}&startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(
            moment(endDate).toISOString())}&tzOffset=${encodeURIComponent(tzOffset())}`, auth())
        .then(validateResponse)
        .then(response => {

          runningResults = merge(runningResults, response.results);
          runningVehicles = merge(runningVehicles, response.vehicles);

          setResults(runningResults);
          setResultVehicles(runningVehicles);

          forceUpdate();
         
          // response.forEach()
          // debugger;
          // return [response.vehicles, response.results];
        })
      }
    , {concurrency:1})
    .then(response => {
      // debugger;
      // setResultVehicles(currentResultVehicles);
      // setResults(currentResults);
      toast('Report complete.', { autoClose: false, position: toast.POSITION.TOP_RIGHT })
    })
    .catch(function(err) {
      toast.error(err.message);
      setExecuting(false);
      throw err;
    })
    .finally(() => {
      // setResultsTotals(response.totals);
      setExecuting(false);
      setExecuted(true);
    });
  }

  const renderExecution = () => {
    if (!executing) {
      return 'Run!'
    }
    if (vehiclesByID[executing]) {
      const vehicle = vehiclesByID[executing];
      return `Processing vehicle ${vehicle.name}...`
    } else {
      return 'Processing...'
    }

  }

  const renderResults = () => {
    if (!executed) {
      return null;
    }
    switch (reportType) {
      case 'idle':
        return <Idle results={results} vehicles={resultVehicles} />
      case 'mileage':
        return <Mileage results={results} vehicles={resultVehicles} />
      case 'daily':
        return <Daily results={results} vehicles={resultVehicles} />
      case 'odometer':
        return <Odometer results={results} vehicles={resultVehicles} />
      case 'speed':
        return <Speed results={results} vehicles={resultVehicles} />
      case 'ignition':
        return <Ignition results={results} vehicles={resultVehicles} />
      case 'start':
        return <Start results={results} vehicles={resultVehicles} />
      case 'summary':
        return <Summary results={results} vehicles={resultVehicles} />
      case 'obd':
        return <Obd results={results} vehicles={resultVehicles} />
      case 'jes':
        return <Jes results={results} vehicles={resultVehicles} />   
      }
  }

  return (
    <div className="business-table">
      <div className="row">
        <div className="col-md-12" style={{ marginTop: '1em', marginBottom: '1em' }}>
          <span>Quick select </span>
          <span className="button-group">
              <button className="btn btn-default">Today</button>
              <button className="btn btn-default">Yesterday</button>
              <button className="btn btn-default">Last 2 Days</button>
              <button className="btn btn-default">Last 3 Days</button>
              <button className="btn btn-default">Last week</button>
              <button className="btn btn-default">Last month</button>
            </span>
          </div>
          <div className="col-md-12" style={{ marginTop: '1em', marginBottom: '1em' }}>
            <DateRangePicker
              startDate={ moment(startDate) } // momentPropTypes.momentObj or null,
              startDateId="reports_start_date_id" // PropTypes.string.isRequired,
              endDate={ moment(endDate) } // momentPropTypes.momentObj or null,
              endDateId="reports_end_date_id" // PropTypes.string.isRequired,
              onDatesChange={ ({ startDate, endDate }) => {
                setStartDate(startDate);
                setEndDate(endDate);
              } } // PropTypes.func.isRequired,
              focusedInput={ focusedInput } // PropTypes.oneOf([START_DATE, END_DATE]) or null,
              onFocusChange={ focusedInput => setFocusedInput(focusedInput) } // PropTypes.func.isRequired,
              isOutsideRange={ () => false }
            />
          </div>
          <div className="col-md-3">
            <select size={ reports.length } className="form-control" onChange={ ev => setReportType(ev.target.value) }>
            { reports.map(key => <option selected={ key === reportType} value={ key }>{key}</option>) }
            </select>
            <button className="btn btn-default btn-success" style={{marginTop:'1em',marginBottom: '1em'}}
              disabled={ executing } onClick={ () => execute(reportType) }
            >
              { renderExecution() }
            </button>
          </div>
      </div>
      <div className="col-sm-3" />
      <div className="row col-md-12">
        { renderResults() }
      </div>
    </div>
  );
}

export default connect(
  state => ({
    impliedSelectedVehiclesByID: state.impliedSelectedVehiclesByID,
    orgsByID: state.orgsByID,
    vehiclesByID: state.vehiclesByID,
  }),
)(Reports);
