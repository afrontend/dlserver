
동네 도서관 책 대출 여부를 알려주는 Web API 서버

**노드 서버를 수행한다.**

    git clone https://github.com/afrontend/dlserver.git
    cd dlserver
    npm install
    node app.js

**도서관 목록을 읽는다**

* JSON: http://localhost:3000/libraryList
* HTML: http://localhost:3000/

**책을 검색한다.**

* JSON: http://localhost:3000/?title=javascript&libraryName=판교
* HTML: http://localhost:3000/javascript/판교

