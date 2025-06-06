    //This create an array of tles(1 and 8 an empty tile)
    let tiles = [...Array(8).keys()].map(n=> n+1);
    tiles.push(null)
    //[1,2,3,4,5,6,7,8]

    const container = document.getElementById("puzzle-container")
    //funciton to render tiles on the grid
    function render(){
        //clear current tiles 
        container.innerHTML = "";

        tiles.forEach((tile,index)=>{
            const tileDiv = document.createElement('div')
            tileDiv.classList.add('tile');
            if(tile === null){ //if tile;1,2 etc not
            //  null we get the empty one if
            //  not so we get tile and then add 
            // it in the div
                tileDiv.classList.add('empty')
            } else{
                tileDiv.textContent = tile;
                tileDiv.addEventListener('click', ()=>moveTile(index))
            }
            container.appendChild(tileDiv)
        });
    }

    function canMove(index){
        //We are getting index of null elemnet in tiles array
        const emptyIndex = tiles.indexOf(null);
        //finding positon of tiles next to each other
        const adjacentIndices = [
            index -1, index + 1, //left/right
            index -3, index + 3 //up/down
        ];

        //Check grid boundary rules
        if(index % 3 ===0) adjacentIndices.splice(adjacentIndices.indexOf(index -1),1); //left edge
        if(index % 3 === 2) adjacentIndices.splice(adjacentIndices.indexOf(index +1),1);//right edge

        return adjacentIndices.includes(emptyIndex)
        //decides if tile is next to if it is next to it moves it it is not it doesnt brings empty slot
    };

    function moveTile(index){
         const emptyIndex = tiles.indexOf(null)
        if(canMove(index)){
            //Swamping tiles
            [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex],tiles[index]]
            render(); //Re-render grid
            checkwin(); //We are checking if game is won
        }
    }

    //Suffle tiles randomly

    function shuffleTiles(){
        do{
            for(let i = tiles.length -1; i > 0; i--){
                const j = Math.floor(Math.random() * (i +1));
                [tiles[i],tiles[j]] = [tiles[j], tiles[i]];
            }
        } while (!isSolvable()); //Repeat if unsolvable
        render();
    }

    //Check if current state is winning one
    function checkwin(){
        const isWon = tiles.slice(0,8).every((val,i) => val === i +1);
        if(isWon) alert("🎉 You won!")
    }

    //Check if puzzle is solavable(for valid shuffle)
    function isSolvable(){
        const arr = tiles.slice();
        const inv = arr.filter(x=> x !==null).reduce((acc,val,i)=>{
            for(let j = i+1; j<arr.length; j++){
                if(arr[j] !== null && arr[j]<val) acc++;
            }
            return acc
        },0);
        return inv % 2 === 0; //Even = solvalbe
    }
    
    //Suffle button
    const shufflebtn = document.getElementById('shuffle')
    shufflebtn.addEventListener('click',shuffleTiles);

//inital render
render()