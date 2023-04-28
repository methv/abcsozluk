const armfield = document.getElementById('aramafield');

armfield.addEventListener('keydown', e => {
	if(e.key == 'Enter'){
		location.href = '/b/' + armfield.value
	}
})