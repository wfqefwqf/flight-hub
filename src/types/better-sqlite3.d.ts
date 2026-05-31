declare module 'better-sqlite3' {
  class Statement {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  class Database {
    constructor(path: string);
    exec(sql: string): this;
    prepare(sql: string): Statement;
  }

  export default Database;
}
