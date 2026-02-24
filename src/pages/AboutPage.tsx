import { Seo } from '@/components/seo/Seo';
import { Shield, Truck, Award, Heart, MapPin, Phone, Mail } from 'lucide-react';
import storeImg from '@/assets/store/agro-brasil-store.png';

const values = [
  { icon: Shield, title: 'Qualidade Garantida', text: 'Trabalhamos com as melhores marcas e fornecedores do mercado agropecuário brasileiro.' },
  { icon: Truck, title: 'Entrega para Todo Brasil', text: 'Enviamos para todos os estados com rapidez e segurança.' },
  { icon: Award, title: 'Experiência no Campo', text: 'Mais de 10 anos atendendo produtores rurais e cavaleiros em todo o país.' },
  { icon: Heart, title: 'Atendimento Humanizado', text: 'Nossa equipe conhece cada produto e pode te ajudar a escolher o melhor para sua necessidade.' },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Seo
        title="Sobre Nós"
        description="Conheça a Agro Brasil: mais de 10 anos levando produtos agropecuários de qualidade para todo o Brasil. Selaria, mantas, vestuário country e muito mais."
        canonicalPath="/sobre"
        keywords={['sobre agro brasil', 'loja agropecuária', 'selaria', 'quem somos']}
      />

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sobre a Agro Brasil
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            A <strong>Agro Brasil</strong> nasceu da paixão pelo campo e pelo compromisso de levar os melhores 
            produtos agropecuários diretamente a quem vive e trabalha no meio rural. 
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Com mais de <strong>10 anos de experiência</strong>, somos especialistas em selaria, mantas para cavalo, 
            vestuário country, botas, chapéus, cordas e muito mais. Cada produto é selecionado 
            pensando na qualidade, durabilidade e no melhor custo-benefício para nossos clientes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Atendemos cavaleiros, fazendeiros, competidores de provas equestres e todos que amam 
            a vida no campo. Nossa missão é facilitar o acesso a produtos de primeira linha, 
            com preços justos e entrega rápida para todo o Brasil.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img src={storeImg} alt="Loja Agro Brasil" className="w-full h-auto object-cover" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { value: '10+', label: 'Anos de Experiência' },
          { value: '5.000+', label: 'Clientes Atendidos' },
          { value: '1.500+', label: 'Produtos no Catálogo' },
          { value: '27', label: 'Estados Atendidos' },
        ].map((stat, i) => (
          <div key={i} className="text-center p-6 bg-card rounded-xl border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Nossos Valores</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <div key={i} className="p-6 bg-card rounded-xl border text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <v.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-primary/5 rounded-2xl p-8 md:p-12 mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Nossa Missão</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fornecer produtos agropecuários de alta qualidade com preços justos, contribuindo 
            para o desenvolvimento sustentável do agronegócio brasileiro e facilitando a vida 
            de quem trabalha e vive no campo.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Onde Estamos</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Endereço</p>
              <p className="text-xs text-muted-foreground">Tangará da Serra - MT</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">(65) 99999-9999</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">E-mail</p>
              <p className="text-xs text-muted-foreground">contato@agrobrasil.com.br</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
