## catonline

# init server
docker-compose up

# query database
docker-compose exec mongo mongo

# useless script to count all the unique words
$ find `pwd` | grep -v data | grep -v tmp | grep -v etc | grep -v node_modules | grep -v package | grep -v logs | grep -v .git | grep '.py\|.js\|.svg\|.css\|.ejs\|.yml' | xargs cat | tr ' ' '\n' | tr '\{' '\n' | tr '\}' '\n' | tr '|' '\n' | tr '(' '\n' | tr ')' '\n' | tr '/' '\n' | tr ';' '\n' | tr "'" '\n' | tr '=' '\n' | tr '.' '\n' | tr ',' '\n' | tr '+' '\n' | tr ':' '\n' | tr '"' '\n' | tr '[' '\n' | tr ']' '\n' | tr '\t' '\n' | tr '<' '\n' | tr '>' '\n' | tr '#' '\n' | tr '!' '\n' | tr '*' '\n' | tr '-' '\n' | tr '\\' '\n' | tr '$' '\n' | tr '~' '\n' | tr '&' '\n' | tr '%' '\n' | tr '?' '\n' | tr '`' '\n' | sort | uniq -c | sort > /tmp/counts.txt
