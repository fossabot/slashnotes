import { createServer as createHttpServer } from 'http'
import {
  readFileSync, existsSync, readdirSync, statSync, writeFileSync
} from 'fs'
import {
  join, extname, sep
} from 'path'

const ContentTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
}

type FilePath = {
  path: string
  type: string
}

function findFiles (dir: string, cwd: string, prev?: FilePath[]): FilePath[] {
  if (!prev) prev = []

  readdirSync(dir).forEach(f => {
    const subPath = join(dir, f)
    if (statSync(subPath).isDirectory())
      return findFiles(subPath, cwd, prev)

    if (f.endsWith('.md')) {
      const path = subPath.replace(cwd, '').replace('.md', '')
      prev.push({
        path,
        type: 'default'
      })
    }
  })

  return prev
}

export class Server {
  public readonly port: number | string
  public readonly folder: string

  constructor () {
    this.port = process.env.PORT || 3000
    this.folder = process.env.FOLDER ? join(process.cwd(), process.env.FOLDER) : process.cwd()
  }

  public async start () {
    const webPath = require.resolve('@slashnotes/web').replace(/index.js$/, 'dist')

    createHttpServer(async (req, res) => {
      console.log(req.method, req.url)
      const headers: {
        [key: string]: string
      } = {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
      }

      if (req.method === 'OPTIONS') {
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        for (const key in headers)
          res.setHeader(key, headers[key])
        res.statusCode = 204
        res.end()
        return
      }

      let path = req.url

      let body = ''

      req.on('readable', function () {
        body += req.read() || ''
      })

      req.on('end', async () => {
        try {
          if (path.startsWith('/__slashnotes/')) {
            const command = path.replace('/__slashnotes/', '')
            switch (command) {
              case 'list':
                res
                  .writeHead(200, headers)
                  .end(JSON.stringify(findFiles(this.folder, this.folder + sep)))
                return
              case 'read': {
                const data = JSON.parse(body)
                res
                  .writeHead(200, headers)
                  .end(JSON.stringify({ body: readFileSync(join(this.folder, data.path + '.md')).toString() }))
                return
              }
              case 'write': {
                const data = JSON.parse(body)
                writeFileSync(join(this.folder, data.path + '.md'), data.body)
                res
                  .writeHead(201, headers)
                  .end()
                return
              }
              default:
                res
                  .writeHead(500, {
                    ...headers,
                    'Content-Type': 'text/plain'
                  })
                  .end('Unknown command: ' + command)
                return
            }
          }

          if (path === '/') path = 'index.html'

          if (existsSync(join(webPath, path))) {
            res
              .writeHead(200, {
                ...headers,
                'Content-Type': ContentTypes[extname(path)]
              })
              .end(readFileSync(join(webPath, path)))
            return
          }

          res
            .writeHead(404, {
              ...headers,
              'Content-Type': 'text/plain'
            })
            .end('Not found file: ' + path)
        } catch (error) {
          res
            .writeHead(500, {
              ...headers,
              'Content-Type': 'text/plain'
            })
            .end(error.message)
        }
      })
    })
      .listen(this.port)

    return this
  }
}
