require('source-map-support').install()
import {generateDocs} from "vineyard-docs"

generateDocs({
  project: {
    name: 'Vineyard Users Documentation'
  },
  paths: {
    src: ['src'],
    content: 'src/doc',
    output: 'doc',
    tsconfig: './tsconfig.json',
  }
})