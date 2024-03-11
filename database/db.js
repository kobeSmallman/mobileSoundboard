import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('soundboard.db');

const defaultSounds = [
 
];

const initDB = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        label TEXT,
        uri TEXT
      );`,
      [],
      (_, success) => {
        console.log("Table created successfully or already exists.");
        // Insert default sounds if not present
        defaultSounds.forEach(sound => {
          tx.executeSql(`SELECT * FROM sounds WHERE uri = ?;`, [sound.uri], (_, { rows }) => {
            if (rows.length === 0) {
              tx.executeSql(`INSERT INTO sounds (label, uri) VALUES (?, ?);`, [sound.label, sound.uri]);
            }
          });
        });
      },
      (_, error) => console.log("Error creating table: ", error)
    );
  });
};

const addSound = (label, uri, callback) => {
  db.transaction(
    (tx) => {
      tx.executeSql("INSERT INTO sounds (label, uri) VALUES (?, ?);", [label, uri], (_, { insertId }) => {
        if (callback) callback(insertId);
      });
    },
    (error) => console.log("Error adding sound: ", error)
  );
};

const fetchSounds = (callback) => {
  db.transaction((tx) => {
    tx.executeSql("SELECT * FROM sounds;", [], (_, { rows }) => {
      if (callback) callback(rows._array);
    });
  }, (error) => console.log("Error fetching sounds: ", error));
};

const updateSoundLabel = (id, label, callback) => {
  db.transaction((tx) => {
    tx.executeSql("UPDATE sounds SET label = ? WHERE id = ?;", [label, id], () => {
      if (callback) callback();
    });
  }, (error) => console.log("Error updating sound label: ", error));
};

const deleteSound = (id, callback) => {
  db.transaction((tx) => {
    tx.executeSql("DELETE FROM sounds WHERE id = ?;", [id], () => {
      if (callback) callback();
    });
  }, (error) => console.log("Error deleting sound: ", error));
};

export { initDB, addSound, fetchSounds, updateSoundLabel, deleteSound };
