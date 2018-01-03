const fetch = require('node-fetch');
const { json } = require('micro')
const acorn = require('acorn');

module.exports = async (req, res) => {
  const input = await json(req);
  const gridId = input.gridId;

  const pageResponse = await fetch(`http://www.puzzgrid.com/grid/${gridId}`);
  const pageHtml = await pageResponse.text();

  const functionCallString =  pageHtml.split('\n')[12];

  const ast = acorn.parse(functionCallString);

  const parsedArgs = ast.body[0].expression.arguments
    .map(arg => {
      if (arg.type === 'Literal') {
        return arg.value;
      }

      if (arg.type === 'ArrayExpression') {
        return arg.elements.map(arrayElement => arrayElement.value);
      }
    });
    
  res.setHeader("Access-Control-Allow-Origin", "*");

  return {
    cards: parsedArgs.slice(0, 16),
    groups: [0, 1, 2, 3].map((value, index) => {
      return {
        cardIds: parsedArgs.slice(16 + index * 4, 16 + (index + 1) * 4)
          .map(id => id - 1),
        answerWords: parsedArgs[32 + index],
        explaination: parsedArgs[36 + index]
      };
    })
  };
}