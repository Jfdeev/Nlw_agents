import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Users, Plus } from "lucide-react";

type Rooms = Array<{
  id: string;
  name: string;
  description: string;
  created_at: string;
}>

export function CreateRoom() {
  const { data, isLoading } = useQuery({
    queryKey: ['get-rooms'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3333/rooms');
      const data: Rooms = await response.json();
      return data;
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Let me Ask
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra salas incríveis para fazer suas perguntas ou criar a sua própria
          </p>
        </div>

        {/* Create Room Button */}
        <div className="text-center mb-12">
          <Link to="/room">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <Plus className="w-5 h-5 mr-2" />
              Criar Nova Sala
            </Button>
          </Link>
        </div>

        {/* Rooms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Salas Disponíveis
            </h2>
            <div className="flex items-center text-gray-500">
              <Users className="w-5 h-5 mr-2" />
              <span>{data?.length || 0} salas</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando salas...</p>
            </div>
          )}

          {/* Rooms Grid */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 border border-gray-200 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                      Ativa
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {room.name}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {room.description}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mt-auto">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Criada em {new Date(room.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <Button className="w-full mt-4 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300">
                    Entrar na Sala
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {data && data.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma sala encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Seja o primeiro a criar uma sala e iniciar as conversas!
              </p>
              <Link to="/room">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Sala
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 mt-16">
          <p>Escolha uma sala existente ou crie a sua própria para começar</p>
        </div>
      </div>
    </div>
  )
}