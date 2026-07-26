import bcrypt from "bcryptjs";

const plain = "parola123";

console.time("hash duration");
const hash1 = await bcrypt.hash(plain, 12);
console.timeEnd("hash duration");

const hash2 = await bcrypt.hash(plain, 12);

console.log("password  :", plain);
console.log("hash 1  :", hash1);
console.log("hash 2  :", hash2);
console.log("Are they the same?:", hash1 === hash2);

console.log("compare password vs hash1:", await bcrypt.compare(plain, hash1));
console.log("compare password vs hash2:", await bcrypt.compare(plain, hash2));
console.log(
  "compare wrong password   vs hash1:",
  await bcrypt.compare("wrongpassword", hash1),
);
