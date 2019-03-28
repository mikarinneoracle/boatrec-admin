FROM mikarinneoracle/boatrec-adw-base:latest

WORKDIR ./
ADD index.js ./
ADD dbconfig.js ./
ADD package.json ./

CMD TNS_ADMIN=/usr/lib/oracle/18.3/client64/lib/wallets; export TNS_ADMIN && \
    npm install && \
    node index.js
