import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";


type Rooms = Array<{
    id: string;
    name: string;
    description: string;
    created_at: string;
}>

export function CreateRoom() {

    const {data, isLoading} = useQuery({
        queryKey: ['get-rooms'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3333/rooms');
            const data: Rooms = await response.json();
            return data;
        }
    })

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-8">Let me Ask</h1>

            {isLoading && <p>Carregando</p>}
            <div>
                {data && JSON.stringify(data, null, 2)}
            </div>

            <div className="">{data?.map((room) => (
                <p key={room.id} className="mt-4 text-gray-600">{room.name}</p>
            ))}
            </div>
            <Link to="/room">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    Acessar Sala
                </Button>
            </Link>
            <p className="mt-4 text-gray-600">Ou entrar em uma sala já existente</p>
        </div>
    )
}