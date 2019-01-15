import React, { Component } from 'react';
import {List, ListItem} from '../../components/List';

class Home extends Component {
  state = {
    equation: "",
    solution: []
    }

    currEquation = ""

    solution = []
    
    currObj = {
      explanation: '',
      diagram: '',
      equation: ''
    }

  inputChange = event => {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    this.setState({
      [event.target.id]: event.target.value
    });
    // console.log(this.state);
  };

  //prelim work including parenthesis. Hands off to solve function
  solveStart = () => {

    let eq = this.state.equation
    this.currEquation = eq
    this.solution = []
    
    //This block handles implied multiplication
    if (eq.search(/\d+\(/)>-1 || eq.search(/\)\(/)>-1) {
      eq = eq.replace(/\d+\(/g, x =>
        x.substring(0,x.length-1) + '<b> * (</b>'
        )
      eq = eq.replace(/\)\(/g,'<b>) * (</b>')
      this.currObj.explanation = 'Inserted implied multiplication symbols by parenthesis'
      this.currObj.equation = eq
      this.solution.push(JSON.parse(JSON.stringify(this.currObj)));
      this.currObj.explanation = '' 
      eq = eq.replace(/<\/?[b|i]>/g,'')
      this.currEquation = eq
      // console.log(eq)
    }

    //checks for vali input, returns erro if invalid
   if (!this.isValidInput(eq)) {
     this.setState({solution:[{
      equation:'<i>Error: invalid input</i>',
      diagram:'',
      explanation:''
    }]})
     return 0
    }

    //solves all parenthesis and replaces them with results
    while (eq.search(/\([^()]+\)/)>-1 ){
      this.currObj.explanation = 'Entering a set of parenthesis'
      this.currObj.diagram = '<b>P</b> --> E --> MD --> AS'

      let front = eq.search(/\([^()]+\)/)+1
      let end =  front
      while (eq[end] !== ')' && end<eq.length){
        end++
      }
      this.currObj.equation = eq.substring(0,front-1)+'<b>'+eq.substring(front-1,end+1)+'</b>'+eq.substring(end+1,eq.length)
      this.solution.push(JSON.parse(JSON.stringify(this.currObj)))
      this.currObj.explanation = ''
      this.currObj.diagram = ''
      this.currEquation = this.currEquation.replace(/<\/?b>/g,'')     
      let contents = this.solve(eq.substring(front,end),1)
      this.currEquation = this.currEquation.replace(/\([^()]+\)/, '<i>'+contents+'</i>')
      this.currObj.explanation = 'Parenthesis set complete'
      this.currObj.equation = this.currEquation
      this.solution.push(JSON.parse(JSON.stringify(this.currObj)))
      eq = this.currEquation.replace(/<\/?[b|i]>/g,'')

    console.log('p done')
    console.log(eq)
    }
    this.solve(eq,0);

    this.setState({
      solution:this.solution,
    })
    console.log(this.currEquation)
  };

  //checks if input is valid with regexs
  isValidInput = (eq) => {

    if (eq.search(/\)\d/)>-1){
      return false
    }
    //checks for validity in parenthesis and replaces
    //parenthesis expression with the number four
    while (eq.search(/\([^()]+\)/)>-1 ){
      // console.log('yes')
      let front = eq.search(/\([^()]+\)/)+1
      let end = front
      while (eq[end] !== ')' && end<eq.length){
        end++
      }
      if (this.isValidInput(eq.substring(front,end))) {
        eq = eq.replace(/\([^()]+\)/, '4')
      } else {
        return false;
      }
    }
    // console.log(eq)
    return /^(?:-?\d+\s*[-\^\+\*\/]\s*)+\s*-?\d+\s*$/.test(eq)
  }

  //maintains order of operations. Hands off to operation function
  solve = (eq, pLevel) => {

    if (eq.search(/-\d+/)===0 || eq.search(/-\(/)===0){

    }

    // exponents
    // console.log(eq)
    eq = this.operation(eq,pLevel,
      '^','^',
      (x,y) => Math.pow(x,y),
      (x,y) => Math.pow(x,y),
      /\^(?![^()]*\))/,
      /(<i>)?-?\d+(<\/i>)?\s*\^\s*(<i>)?-?\d+(<\/i>)?/,
      ['Starting exponent phase','<b>E</b> --> MD --> AS'])

    // multiply and devide
    eq = this.operation(eq,pLevel,
      '*','/',
      (x,y) => x*y,(x,y) => x/y,
      /[\*|\/](?![^()]*\))/,
      /(<i>)?-?\d+(<\/i>)?\s*[\*|\/]\s*(<i>)?-?\d+(<\/i>)?/,
      ['Starting multiplication and division phase','E --> <b>MD</b> --> AS'])

    //converts - to +- so just addition is used
    //with minus as a negative symbol
    eq = eq.replace(/-/g,'+-')
    eq = eq.replace(/\++/g,'+')
    if (eq[0] === '+') {
      eq = eq.substring(1)
      console.log(eq)
      console.log('cmon')
    }

    //add and subtract
    eq = this.operation(eq,pLevel,
      '+','+',
      (x,y) => x+y,(x,y) => x+y,
      /\+/,
      /(<i>)?-?\d+(<\/i>)?\s*\+\s*(<i>)?-?\d+(<\/i>)?/,
      ['Starting addition and subtraction phase','E --> MD --> <b>AS</b>'])

    console.log(eq)

    return parseInt(eq,10);
  };

  //Completes all occurunces of the designated operation in eq
  operation = (eq,pLevel,op1,op2,op1f,op2f,searchRegex,replaceRegex,statements) => {

    //skips back to solve if no operators
    if ('string' === typeof eq){
      if (!(eq.search(searchRegex)>-1)){
        return eq
      }
    } else {
      return eq
    }

    //<b> and <i> used for highlighting, this clears them
    eq = eq.replace(/<\/?[b|i]>/g,'')

    //Creates statement based on whether inside of parenthesis
    let pStrs = (pLevel===0)?(['','P --> ']):([' (within set of parenthesis)','<b>P</b> -- > '])
    this.currObj.explanation = statements[0]+pStrs[0]
    this.currObj.diagram = pStrs[1] + statements[1]

    //loops until no more occurunces of operator
    while(eq.search(searchRegex)>0){
      
      //highlights next operations, pushes, and clears for next operation
      if (pLevel === 0) {
        this.currEquation = this.currEquation.replace(replaceRegex,x => '<b>'+x+'</b>')
      } else {
        this.currEquation = this.currEquation.replace(/\([^()]+\)/,y => y.replace(replaceRegex,x => '<b>'+x+'</b>'))         
      }
      this.currObj.equation = this.currEquation
      this.solution.push(JSON.parse(JSON.stringify(this.currObj)))
      this.currObj.explanation = ''
      this.currObj.diagram = ''
      this.currEquation = this.currEquation.replace(/<\/?[b|i]>/g,'')

      //grabs the 1st operation, splits at operator, does operation
      let arr =  replaceRegex.exec(eq)
      let numbers = arr[0].split(searchRegex)
      let answer
      if (arr[0].indexOf(op1)>-1){
        answer =  op1f(parseInt(numbers[0]),parseInt(numbers[1]))
      } else {
        answer =  op2f(parseInt(numbers[0]),parseInt(numbers[1]))
      }

      //replaces operator and operands with result
      if (pLevel === 0) {
        this.currEquation = this.currEquation.replace(replaceRegex,'<i>'+answer+'</i>')
      } else {
        this.currEquation = this.currEquation.replace(/\([^()]+\)/,x => x.replace(replaceRegex,'<i>'+answer+'</i>'))
      }
      eq = eq.replace(replaceRegex,answer)
      //readies equation to be pushed after next operation is highlighted
      this.currObj.equation = this.currEquation
    }   
    //pushes last operation of the phase
    this.solution.push(JSON.parse(JSON.stringify(this.currObj)))
    // console.log(eq) 
    return eq
  };

  // simple render
  render() {
    return (
      <div>
        <div>
          <input id="equation" onChange={this.inputChange} />     
          <button onClick={this.solveStart} >Solve!</button>
        </div>
        <List>
          {this.state.solution.map((o,i) => 
            (
              <ListItem key={i}>
                <p dangerouslySetInnerHTML={{__html: o.explanation}}></p>
                <p dangerouslySetInnerHTML={{__html: o.diagram}}></p>
                <p dangerouslySetInnerHTML={{__html: o.equation}}></p>
              </ListItem>
            )
            )}
        </List>
      </div>
      );
  }
}

export default Home;