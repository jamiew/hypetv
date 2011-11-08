desc 'Deploy'
task :deploy do
  sh 'rsync -rtzh --progress --delete ./ jamiew@txd:~/web/public/secret/hypetv'
end
