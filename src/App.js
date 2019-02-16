import React, { Component } from 'react';
import './App.css';

const SEGMENT_SIZE = 10;
const ARENA_DIMENSIONS_PX = [700, 450];

const toPx = (v) => '' + v + 'px';
const segmentsToArenaPx = (n) => toPx(n * SEGMENT_SIZE);
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';
const UP = 'UP';
const DOWN = 'DOWN';
const DISALLOWED = {
  LEFT: RIGHT,
  RIGHT: LEFT,
  UP: DOWN,
  DOWN: UP
};
const BOUNCE = {
  LEFT: UP,
  RIGHT: DOWN,
  UP: RIGHT,
  DOWN: LEFT
};

const directionFromKeyCode = (code) => {
  if (code.startsWith('Arrow')) {
    return code.substring('Arrow'.length).toUpperCase();
  }
  return undefined;
};

const boundaryCollision = ([x,y]) => {
  if (x < 0) {
    return LEFT;
  } else if (x >= 70) {
    return RIGHT;
  } else if (y >= 45) {
    return DOWN;
  } else if (y < 0) {
    return UP;
  }
  return undefined;
};

const newPos = (oldPos, direction) => {
  if (direction === UP) {
    return [oldPos[0], oldPos[1] - 1];
  } else if (direction === DOWN) {
    return [oldPos[0], oldPos[1] + 1];
  } else if (direction === LEFT) {
    return [oldPos[0] - 1, oldPos[1]];
  } else if (direction === RIGHT) {
    return [oldPos[0] + 1, oldPos[1]];
  } else {
    return oldPos;
  }
};

const _randomFruit = () => {
  return [Math.floor(Math.random() * 70), Math.floor(Math.random() * 45)];
};

const randomFruit = (segments) => {
  let pos = _randomFruit()
  while(anyColliding(pos, segments)) {
    pos = _randomFruit();
  };
  return pos;
};

const collision = ([x, y], [a, b]) => x === a && y === b;
const anyColliding = (subject, points) => points.reduce((acc, point) => acc || collision(point, subject), false);

const initialSegments = [[35, 22], [36, 22], [37, 22], [38, 22]];
const initialState = {
  tickHandle: null,
  segments: initialSegments,
  currentHeadDirection: LEFT,
  requestedHeadDirection: LEFT,
  fruit: randomFruit(initialSegments),
  gameOver: false
};

class App extends Component {

  constructor(props) {
    super(props);
    const segments = [[35, 22], [36, 22], [37, 22], [38, 22]];
    this.state = {
      tickHandle: null,
      segments: segments,
      currentHeadDirection: LEFT,
      requestedHeadDirection: LEFT,
      fruit: randomFruit(segments),
      gameOver: false,
      firstPlay: true
    };
  }

  startOver() {
    this.setState(initialState);
    this.start();
  }

  start() {
    this.setState({firstPlay: false, tickHandle: setInterval(() => this.tick(), 100)});
  }

  stop() {
    clearInterval(this.state.tickHandle);
    this.setState({tickHandle: null});
  }

  componentDidMount() {
    document.onkeydown = (e) => {
      const dir = directionFromKeyCode(e.code);
      if (dir && dir !== DISALLOWED[this.state.currentHeadDirection]) {
        this.setState({ requestedHeadDirection: dir });
      }
    };
  }

  componentWillUnmount() {
    this.stop();
  }

  gameOver() {
    this.stop();
    this.setState({gameOver: true});
  }

  tick() {
    // Create new segment at front in new position according to new direction
    // Chop last segment off end (unless you ate fruit)
    // Handle boundary collisions
    // Handle self-collisions

    let newCurrentDirection = this.state.requestedHeadDirection;
    let newRequestedDirection = this.state.requestedHeadDirection;
    const newSegments = this.state.segments.slice();

    // Handle boundary, if new pos crashes do something sensible to
    // new pos AND override the requested direction and current direction
    const [head, ...tail] = this.state.segments;
    let newHead = newPos(head, newCurrentDirection);

    // Collision with self?
    if (anyColliding(newHead, tail)) {
      // Game over!
      this.gameOver();
    }

    let boundary = boundaryCollision(newHead);
    if (boundary) {
      newCurrentDirection = BOUNCE[boundary];
      newRequestedDirection = newCurrentDirection;
      newHead = newPos(head, newCurrentDirection)
    }
    newSegments.unshift(newHead);

    const newState = {
      currentHeadDirection: newCurrentDirection,
      requestedHeadDirection: newRequestedDirection,
      segments: newSegments
    };

    // Eat fruit?
    if (collision(this.state.fruit, newHead)) {
      // Add new segment (as well as not taking away one)
      // Place it in opposite direction of head travel, adjusting for boundary
      let dir = DISALLOWED[newCurrentDirection];
      let newTail = newPos(tail[tail.length - 1], dir);
      boundary = boundaryCollision(newTail);
      if (boundary) {
        dir = BOUNCE[boundary];
        newTail = newPos(tail[tail.length - 1], dir);
      }
      newSegments.push(newTail);

      // Create new fruit
      newState.fruit = randomFruit(newState.segments);
    } else {
      newSegments.pop();
    }

    this.setState(newState);
  }

  render() {
    console.log(this.state);
    if (this.state.gameOver) {
      return <div className="app">
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-around', color: 'black'}}>
          <div style={{fontSize: '50px'}}>GAME OVER!</div>
          <div style={{fontSize: '35px'}}>You scored {this.state.segments.length - 4} points.</div>
          <button style={{fontSize: '35px'}} onClick={() => this.startOver()}>START OVER?</button>
        </div>
      </div>;
    }
    return (
      <div className="app">
        <div className="controls">
          <div style={{width: '30%'}}>
            <div className="control">
            {this.state.firstPlay
              ? <button onClick={() => this.start()}>Start</button>
              : <button onClick={() => this.state.tickHandle ? this.stop() : this.start()}>
                  {this.state.tickHandle ? 'Pause' : 'Unpause'}
                </button>}
            </div>
          </div>
          <div className="score">Your score is: {this.state.segments.length - 4}</div>
        </div>
        <div className="arena"
             style={{
               width: toPx(ARENA_DIMENSIONS_PX[0]),
               height: toPx(ARENA_DIMENSIONS_PX[1])
             }}>
          {this.state.segments.map(([x, y]) => <Segment key={`snake_${x}${y}`} x={x} y={y} />)}
          <Segment type='fruit' key={`fruit_${this.state.fruit[0]}${this.state.fruit[1]}`} x={this.state.fruit[0]} y={this.state.fruit[1]} />
        </div>
      </div>
    );
  }
}

class Segment extends Component {
  render() {
    const classes = `segment${this.props.type ? ' ' + this.props.type : ''}`;
    return <div
      className={classes}
      style={{
        left: segmentsToArenaPx(this.props.x),
        top: segmentsToArenaPx(this.props.y)
      }} />
  }
}


export default App;
