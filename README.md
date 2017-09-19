
동네 도서관 책 대출 여부를 알려주는 Web API 서버

**노드 서버를 수행한다.**

    npm install
    node app.js

**도서관 목록을 읽는다**

http://localhost:3000/libraryList

**책을 검색한다.**

http://localhost:3000/search?title=javascript&libraryName=판교

**간편 URL로 검색한다.**

http://localhost:3000/search/javascript/판교
