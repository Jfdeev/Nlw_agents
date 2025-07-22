import { Button } from "./components/ui/button";
import { Routes, Route } from "react-router-dom";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";


export function App() {

  return (
    <Routes>
      <Route element={ <CreateRoom />} index/>
      <Route path="/room" element={<Room />}/>
    </Routes>
  )
}


