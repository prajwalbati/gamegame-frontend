import Head from 'next/head'
import {useState, useEffect} from 'react';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';


export default function Home() {

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  const [game, setGame] = useState({});
  const [round, setRound] = useState(1);
  const [guessNumber, setGuessNumber] = useState('');
  const [numberError, setNumberError] = useState('');
  const [userCredits, setUserCredits] = useState([]);
  const [secretNumbers, setSecretNumbers] = useState([]);
  const [roundDetails, setRoundDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'User Credit Chart',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      }
    },
  };

  let basicChartData = {
    options,
    data: {
      labels : [],
      datasets: [
        {
          label: "Player 1",
          data: []
        },
        {
          label: "Player 2",
          data: []
        },
        {
          label: "Player 3",
          data: []
        },
        {
          label: "Player 4",
          data: []
        },
        {
          label: "Player 5",
          data: []
        }
      ],
    }
  };
  const [chartData, setChartData] = useState(basicChartData);

  const updateChartData = (data) => {
    basicChartData.data.labels = ['Start'];
    basicChartData.data.datasets[0].data = [0];
    basicChartData.data.datasets[1].data = [0];
    basicChartData.data.datasets[2].data = [0];
    basicChartData.data.datasets[3].data = [0];
    basicChartData.data.datasets[4].data = [0];
    for (let i = 0; i < data.length; i++) {
      const round = data[i];
      basicChartData.data.labels.push('Round '+round.round);
      basicChartData.data.datasets[0].data.push(round['Player 1'].credit);
      basicChartData.data.datasets[1].data.push(round['Player 2'].credit);
      basicChartData.data.datasets[2].data.push(round['Player 3'].credit);
      basicChartData.data.datasets[3].data.push(round['Player 4'].credit);
      basicChartData.data.datasets[4].data.push(round['Player 5'].credit);
    }
    console.log(basicChartData);
    setChartData(basicChartData);
  };


  useEffect(() => {
    socket.on('connect', (data) => {
      console.log('Socket connected');
    });

    socket.on('creditUpdated', function (data) {
      console.log('Credit Updated');
      setLoading(false);
      if(data.emitData && data.gameDetails) {
        setGame(data.gameDetails);
        setRoundDetails(data.emitData);
        updateChartData(data.emitData);
      }
    });
  }, []);

  const changeHandler = (e) => {
    let enteredNumber = e.target.value;
    if(Number(enteredNumber) > 0 && Number(enteredNumber) < 10) {
      setGuessNumber(Number(enteredNumber));
      setNumberError('');
    } else {
      setNumberError('Number must be between 0 to 9.99');
    }
  }

  const submitGuessNumber = ()=> {
    if(numberError!="") return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/${game.gameId}/submit-guess/${game.roundId}`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        'guessedNumber': guessNumber
      })
    })
    .then(function(response){
      return response.json()})
    .then(function(data) {
      socket.emit('creditUpdate', {roundId: game.roundId, gameId: game.gameId, round: round});
    }).catch(error => console.error('Error:', error));
  }

  const startGame = async() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/start-game`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      }
    })
    .then(function(response){
      return response.json()})
    .then(function(data) {
      setGame(data.gameDetails);
    }).catch(error => console.error('Error:', error));
  };

  const startNewGame = () => {
    window.location.reload();
  }

  return (
    <div className="container">
      <Head>
        <title>Guess Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Welcome to Guess Game
        </h1>

        {game?.gameId ? (
          <>
            <h3>Round {roundDetails.length + 1}</h3>
            <p className="description">
              Enter your guess number
            </p>
            <div>
              <input type="number" id="guessNumberInput" className="form-control mb-2" onChange={changeHandler} />
              <p className={numberError!=''?'text-danger':'d-none'}>{numberError}</p>
              <button className="btn btn-primary mr-2" onClick={submitGuessNumber}>{loading?'Submitting':'Submit'}</button>
              <button className="btn btn-warning ml-2" onClick={startNewGame}>Start New</button>
            </div>


            <table className="table table-hover my-4">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Secret Number</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Player 3</th>
                  <th>Player 4</th>
                  <th>Player 5</th>
                </tr>
              </thead>
              <tbody>
                {roundDetails.map((round, i) => (
                  <tr key={i}>
                    <td>{round.round}</td>
                    <td>{round.secret}</td>
                    <td>Guess: {round['Player 1']?.guessNumber}<br />Credit: {round['Player 1']?.credit}</td>
                    <td>Guess: {round['Player 2']?.guessNumber}<br />Credit: {round['Player 2']?.credit}</td>
                    <td>Guess: {round['Player 3']?.guessNumber}<br />Credit: {round['Player 3']?.credit}</td>
                    <td>Guess: {round['Player 4']?.guessNumber}<br />Credit: {round['Player 4']?.credit}</td>
                    <td>Guess: {round['Player 5']?.guessNumber}<br />Credit: {round['Player 5']?.credit}</td>
                  </tr>
                ))}

              </tbody>
            </table>
            <Line options={chartData.options} data={chartData.data} redraw />
          </>
        ) : (
          <>
            <p className="description">
              Click Start Game Button to start game
            </p><br />
            <div>
              <button className="btn btn-primary" onClick={startGame}>Start Game</button>
            </div>
          </>
        )}
      </main>


      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
