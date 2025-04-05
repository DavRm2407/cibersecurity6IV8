/*alert("holip")

localStorage.setItem('Darkmode', false)

//obtener valor de variables

const valor = localStorage.getItem('Darkmode')
console.log('El valor es: '+ valor)

//localStorage.removeItem('Darkmode')

const NameKey = 'name'
sessionStorage.setItem(NameKey, 'Dav')

const valor1 = sessionStorage.getItem(NameKey)
console.log('El valor es: ' + valor1)

//eliminar sessionstorage

sessionStorage.removeItem(NameKey)
*/
const People = {
    name: 'Louis',
    age: 17
}

const ssPeopleKey = "Persona"
sessionStorage.setItem(ssPeopleKey,JSON.stringify(People))
const ssPeople = JSON.parse(sessionStorage.getItem(ssPeopleKey))

console.log(ssPeople.name)
console.log(ssPeople.age)