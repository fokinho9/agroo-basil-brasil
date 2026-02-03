import { Layout } from '@/components/layout/Layout';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-6">Sobre Nós</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          A AgroShop nasceu da paixão pelo campo e pelo compromisso de levar os melhores 
          produtos agrícolas diretamente ao produtor rural. Com anos de experiência no 
          setor, entendemos as necessidades do homem do campo e trabalhamos incansavelmente 
          para oferecer soluções de qualidade.
        </p>

        <div className="grid md:grid-cols-3 gap-8 my-12">
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-4xl font-bold text-primary mb-2">10+</div>
            <p className="text-muted-foreground">Anos de Experiência</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-4xl font-bold text-primary mb-2">5000+</div>
            <p className="text-muted-foreground">Clientes Satisfeitos</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <p className="text-muted-foreground">Produtos Disponíveis</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Nossa Missão</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Fornecer produtos agrícolas de alta qualidade com preços justos, contribuindo 
          para o desenvolvimento sustentável do agronegócio brasileiro.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Nossos Valores</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>Qualidade em tudo que fazemos</li>
          <li>Compromisso com o cliente</li>
          <li>Sustentabilidade e responsabilidade ambiental</li>
          <li>Inovação constante</li>
          <li>Transparência nas relações</li>
        </ul>
      </div>
    </div>
  );
}
